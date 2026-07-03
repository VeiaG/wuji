'use client'

import React, { createContext, useCallback, use, useEffect, useState } from 'react'

import type {
  AuthContext,
  Create,
  ForgotPassword,
  Login,
  Logout,
  RefreshToken,
  ResetPassword,
} from './types'

import { gql, USER } from './gql'
import { rest } from './rest'
import { User } from '@/payload-types'
import { Permissions } from 'payload'

const Context = createContext({} as AuthContext)

// Result of an authenticated REST auth request (`/me`, `/refresh-token`).
// `status: 'error'` means the request failed or returned an unexpected response
// and the caller should keep the current session rather than clearing it.
type AuthRestResult =
  | { status: 'ok'; user: null | User; exp: null | number }
  | { status: 'error' }

// Shared low-level fetch for the REST auth endpoints. Both `/me` and
// `/refresh-token` return `{ user, exp }` at the top level.
const fetchAuthRest = async (url: string, method: 'GET' | 'POST'): Promise<AuthRestResult> => {
  try {
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) return { status: 'error' }

    const data = await res.json()

    return {
      status: 'ok',
      user: data?.user ?? null,
      exp: typeof data?.exp === 'number' ? data.exp : null,
    }
  } catch {
    return { status: 'error' }
  }
}

export const AuthProvider: React.FC<{ api?: 'gql' | 'rest'; children: React.ReactNode }> = ({
  api = 'rest',
  children,
}) => {
  const [user, setUser] = useState<null | User>()
  const [permissions, setPermissions] = useState<null | Permissions>(null)
  // Unix timestamp (seconds) when the current token expires — used to schedule refreshes.
  const [exp, setExp] = useState<null | number>(null)

  const create = useCallback<Create>(
    async (args) => {
      if (api === 'rest') {
        const user = await rest(`/api/users`, args)
        setUser(user)
        return user
      }

      if (api === 'gql') {
        const { createUser: user } = await gql(`mutation {
        createUser(data: { email: "${args.email}", password: "${args.password}", firstName: "${args.firstName}", lastName: "${args.lastName}" }) {
          ${USER}
        }
      }`)

        setUser(user)
        return user
      }
    },
    [api],
  )

  const login = useCallback<Login>(
    async (args) => {
      if (api === 'rest') {
        const user = await rest(`/api/users/login`, args)
        setUser(user)
        return user
      }

      if (api === 'gql') {
        const { loginUser } = await gql(`mutation {
        loginUser(email: "${args.email}", password: "${args.password}") {
          user {
            ${USER}
          }
          exp
        }
      }`)

        setUser(loginUser?.user)
        return loginUser?.user
      }
    },
    [api],
  )

  const logout = useCallback<Logout>(async () => {
    if (api === 'rest') {
      await rest(`/api/users/logout`)
      setUser(null)
      setExp(null)
      return
    }

    if (api === 'gql') {
      await gql(`mutation {
        logoutUser
      }`)

      setUser(null)
      setExp(null)
    }
  }, [api])

  // Refresh the auth token while it is still valid, extending the session and
  // updating the stored expiration. A refresh only succeeds with a non-expired
  // token; once the token has expired the user must log in again.
  const refreshToken = useCallback<RefreshToken>(async () => {
    if (api === 'rest') {
      const result = await fetchAuthRest(`/api/users/refresh-token`, 'POST')
      // On failure keep the existing session; the caller retries on the next tick.
      if (result.status !== 'ok' || !result.user) return false
      setUser(result.user)
      if (result.exp !== null) setExp(result.exp)
      return true
    }

    if (api === 'gql') {
      try {
        const { refreshTokenUser } = await gql(`mutation {
          refreshTokenUser {
            user {
              ${USER}
            }
            exp
          }
        }`)

        if (!refreshTokenUser?.user) return false
        setUser(refreshTokenUser.user)
        if (typeof refreshTokenUser?.exp === 'number') {
          setExp(refreshTokenUser.exp)
        }
        return true
      } catch {
        return false
      }
    }

    return false
  }, [api])

  // On mount, get user and set
  useEffect(() => {
    const fetchMe = async () => {
      if (api === 'rest') {
        // Use the shared helper (rather than the `rest` helper) so we can read
        // the token expiration (`exp`) alongside the user.
        const result = await fetchAuthRest(`/api/users/me`, 'GET')
        // Only commit a definitive result. On a transient error keep the current
        // state so a network blip doesn't clear an otherwise-valid session.
        if (result.status === 'ok') {
          setUser(result.user)
          setExp(result.exp)
        }
      }

      if (api === 'gql') {
        const { meUser } = await gql(`query {
          meUser {
            user {
              ${USER}
            }
            exp
          }
        }`)

        setUser(meUser.user)
        setExp(typeof meUser?.exp === 'number' ? meUser.exp : null)
      }
    }

    void fetchMe()
  }, [api])

  const forgotPassword = useCallback<ForgotPassword>(
    async (args) => {
      if (api === 'rest') {
        const user = await rest(`/api/users/forgot-password`, args)
        return user
      }

      if (api === 'gql') {
        const { forgotPasswordUser } = await gql(`mutation {
        forgotPasswordUser(email: "${args.email}")
      }`)

        return forgotPasswordUser
      }
    },
    [api],
  )

  const resetPassword = useCallback<ResetPassword>(
    async (args) => {
      if (api === 'rest') {
        const user = await rest(`/api/users/reset-password`, args)
        setUser(user)
        return user
      }

      if (api === 'gql') {
        const { resetPasswordUser } = await gql(`mutation {
        resetPasswordUser(password: "${args.password}", token: "${args.token}") {
          user {
            ${USER}
          }
        }
      }`)

        setUser(resetPasswordUser.user)
        return resetPasswordUser.user
      }
    },
    [api],
  )

  return (
    <Context
      value={{
        create,
        exp,
        forgotPassword,
        login,
        logout,
        permissions,
        refreshToken,
        resetPassword,
        setPermissions,
        setUser,
        user,
      }}
    >
      {children}
    </Context>
  )
}

type UseAuth = () => AuthContext

export const useAuth: UseAuth = () => use(Context)
