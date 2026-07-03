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
      try {
        const res = await fetch(`/api/users/refresh-token`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!res.ok) return

        const data = await res.json()

        if (data?.user) {
          setUser(data.user)
        }
        if (typeof data?.exp === 'number') {
          setExp(data.exp)
        }
      } catch {
        // Network error — keep the existing session and retry on the next tick.
      }
      return
    }

    if (api === 'gql') {
      const { refreshTokenUser } = await gql(`mutation {
        refreshTokenUser {
          user {
            ${USER}
          }
          exp
        }
      }`)

      if (refreshTokenUser?.user) {
        setUser(refreshTokenUser.user)
      }
      if (typeof refreshTokenUser?.exp === 'number') {
        setExp(refreshTokenUser.exp)
      }
    }
  }, [api])

  // On mount, get user and set
  useEffect(() => {
    const fetchMe = async () => {
      if (api === 'rest') {
        // Fetch directly (rather than via the `rest` helper) so we can read the
        // token expiration (`exp`) alongside the user.
        try {
          const res = await fetch(`/api/users/me`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          const data = await res.json()
          setUser(data?.user ?? null)
          setExp(typeof data?.exp === 'number' ? data.exp : null)
        } catch {
          setUser(null)
          setExp(null)
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
