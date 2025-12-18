import crypto from 'crypto'
import { google } from 'googleapis'
import { type AuthStrategy, type AuthStrategyResult } from 'payload'

import { type User } from '@/payload-types'
import { getServerSideURL } from '@/lib/getURL'
import { mergeAuth } from '@/lib/mergeAuth'

interface SessionUser extends User {
  _sid?: string
  _strategy?: string
  collection: 'users'
}

const clientId = process.env.GOOGLE_CLIENT_ID!
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!

export const googleStrategy: AuthStrategy = {
  async authenticate({ headers, payload }): Promise<AuthStrategyResult> {
    const code = headers.get('x-oauth-code')
    const codeVerifier = headers.get('x-oauth-verifier')
    const strategy = headers.get('x-auth-strategy')

    if (strategy !== 'google') {
      return { user: null }
    }
    if (!code || !codeVerifier) {
      payload.logger.info('Google auth strategy called without code or code verifier')
      return { user: null }
    }

    try {
      const oauth2Client = new google.auth.OAuth2({
        clientId,
        clientSecret,
        redirectUri: `${getServerSideURL()}/api/users/auth/google/callback`,
      })

      const { tokens } = await oauth2Client.getToken({ code, codeVerifier })

      if (!tokens.access_token) {
        payload.logger.info('Google auth strategy failed to obtain access token')
        return { user: null }
      }

      oauth2Client.setCredentials(tokens)

      const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' })
      const { data: profile } = await oauth2.userinfo.get()

      const email = profile.email?.toLowerCase()
      if (!email) {
        payload.logger.info('Google auth strategy failed to obtain user email')
        return { user: null }
      }

      let user = (
        await payload.find({
          collection: 'users',
          limit: 1,
          pagination: false,
          showHiddenFields: true,
          where: {
            email: {
              equals: email,
            },
          },
        })
      ).docs[0] as SessionUser

      if (!user) {
        payload.logger.info(
          `Google auth strategy no user found with email: ${email}. Creating new user`,
        )
        const nickname = profile.name || profile.email?.split('@')[0] || 'Google User'
        const createData = {
          email,
          nickname: profile.given_name || nickname,
          password: crypto.randomBytes(16).toString('hex'), //Random password , user will login via google oauth, can be changed later
        }
        const createdUser = await payload.create({
          collection: 'users',
          data: {
            email: createData.email,
            nickname: createData.nickname,
            password: createData.password,
            roles: ['user'],
            _verified: true,
          },
          showHiddenFields: true,
          draft: false,
          disableVerificationEmail: true,
        })
        user = createdUser as SessionUser
      }

      const collection = payload.collections['users']
      const authConfig = collection.config.auth

      let sid: string | undefined
      const now = new Date()
      const tokenExpInMs = (authConfig.tokenExpiration || 7200) * 1000
      const expiresAt = new Date(now.getTime() + tokenExpInMs)

      if (authConfig.useSessions) {
        sid = crypto.randomUUID()
        const session = {
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          id: sid,
        }

        user.sessions = Array.isArray(user.sessions)
          ? [...removeExpiredSessions(user.sessions), session]
          : [session]
      }

      const existingStrategies = user?.authStrategies ?? []

      const existing = existingStrategies.find((s) => s.authProvider === strategy)

      const googleUpdate = {
        accessToken: tokens.access_token,
        authProvider: 'google' as const,
        idToken: tokens.id_token,
        providerUserId: profile.id,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
        tokenType: tokens.token_type ?? 'Bearer',
      }

      const googleAuth = mergeAuth(existing, googleUpdate)

      const authStrategies = [
        ...existingStrategies.filter((s) => s?.authProvider !== 'google'),
        googleAuth,
      ]

      await payload.db.updateOne({
        collection: 'users',
        data: {
          authStrategies: [...(user.authStrategies || []), ...authStrategies],
          sessions: user.sessions,
        },
        id: user.id,
        returning: false,
      })

      const sessionUser: SessionUser = {
        ...user,
        _sid: sid,
        _strategy: 'google',
        collection: 'users',
      }

      return { user: sessionUser }
    } catch (error) {
      console.error('Google authentication error:', error)
      return { user: null }
    }
  },
  name: 'google',
}

export const removeExpiredSessions = (
  sessions: {
    createdAt?: null | string
    expiresAt: string
    id: string
  }[],
) => {
  const now = new Date()
  return sessions.filter(({ expiresAt }) => new Date(expiresAt) > now)
}
