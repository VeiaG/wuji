'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/providers/auth'

// Refresh the auth token once it has less than this much lifetime left. With a
// 30-day token this means we renew at most roughly once a week per browser, so
// active users effectively never get logged out, without spamming the API.
const REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// setTimeout only supports delays up to ~24.8 days (2^31-1 ms); a longer delay
// silently overflows and fires immediately. Cap each wait so a long-open tab
// keeps re-evaluating instead of overflowing (and to survive clock changes).
const MAX_TIMEOUT_MS = 6 * 60 * 60 * 1000 // 6 hours

// When a refresh attempt fails inside the refresh window, retry with exponential
// backoff instead of idling until the token expires.
const RETRY_BASE_MS = 30 * 1000 // 30 seconds
const MAX_RETRIES = 5

/**
 * Keeps the frontend auth session alive.
 *
 * The Payload admin panel auto-refreshes its token, but the public frontend did
 * not, so a token issued once would eventually expire even for active users and
 * kick them out. This client component reads the token expiration (`exp`) and
 * calls `/api/users/refresh-token` shortly before it lapses — only while the
 * token is still valid, since an expired token cannot be refreshed.
 *
 * Renders nothing; mount it once inside `AuthProvider` (see the root layout).
 */
export const TokenRefresh = () => {
  const { user, exp, refreshToken } = useAuth()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    // Not logged in, or expiration unknown — nothing to schedule.
    if (!user || !exp) return

    let cancelled = false
    let retries = 0

    const clear = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = undefined
      }
    }

    // Renew inside the refresh window. On success `exp` advances, which re-runs
    // this effect and schedules the next cycle. On failure, back off and retry
    // (bounded) so a transient error doesn't leave us idle until expiration.
    const attemptRefresh = async () => {
      const ok = await refreshToken()
      if (cancelled || ok) return

      if (retries >= MAX_RETRIES) return
      const delay = Math.min(RETRY_BASE_MS * 2 ** retries, MAX_TIMEOUT_MS)
      retries += 1
      timeoutRef.current = setTimeout(schedule, delay)
    }

    const schedule = () => {
      clear()
      if (cancelled) return

      const msUntilExp = exp * 1000 - Date.now()

      // Already expired — a refresh would fail; user must log in again.
      if (msUntilExp <= 0) return

      // Inside the refresh window: renew now (with retry via attemptRefresh).
      if (msUntilExp <= REFRESH_THRESHOLD_MS) {
        void attemptRefresh()
        return
      }

      // Otherwise wait until we enter the refresh window (capped, see above).
      const delay = Math.min(msUntilExp - REFRESH_THRESHOLD_MS, MAX_TIMEOUT_MS)
      timeoutRef.current = setTimeout(schedule, delay)
    }

    // Re-check when the tab regains focus, since background timers get throttled
    // and won't fire while the device is asleep. Reset the retry budget too — the
    // network may have recovered while the tab was hidden.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        retries = 0
        schedule()
      }
    }

    schedule()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      clear()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user, exp, refreshToken])

  return null
}
