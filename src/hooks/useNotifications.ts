'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { stringify } from 'qs-esm'

const POLL_INTERVAL = 60_000 // 1 хвилина

export interface UseNotificationsReturn {
  unreadCount: number
  refresh: () => Promise<void>
}

export function useNotifications(userId?: string): UseNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return
    try {
      const qs = stringify({
        where: { user: { equals: userId }, read: { equals: false } },
      })
      const res = await fetch(`/api/notifications/count?${qs}`, { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.totalDocs ?? 0)
    } catch (error) {
      console.error('[useNotifications] Failed to fetch count:', error)
    }
  }, [userId])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  useEffect(() => {
    if (!userId) return
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [userId, fetchUnreadCount])

  return { unreadCount, refresh: fetchUnreadCount }
}
