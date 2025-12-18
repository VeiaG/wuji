import { google } from 'googleapis'
import { type Endpoint, type PayloadRequest } from 'payload'
import configPromise from '@payload-config'
import crypto from 'crypto'
import {
  generatePayloadCookie,
  getPayload,
  jwtSign,
  parseCookies,
  type SanitizedPermissions,
  type TypedUser,
} from 'payload'
import { CodeChallengeMethod, generateCodeChallenge, generateCodeVerifier } from '@/lib/auth/pke'
import { getServerSideURL } from '@/lib/getURL'

const isProduction = process.env.NODE_ENV === 'production'
const clientId = process.env.GOOGLE_CLIENT_ID!
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
const hostname = process.env.NODE_ENV === 'production' ? 'wuji.world' : 'localhost'

export const googleAuth: Endpoint = {
  handler: async (req: PayloadRequest): Promise<Response> => {
    const url = new URL(req.url ?? '')
    const consentFlag = url.searchParams.get('force_consent') === 'true'

    const oauth2Client = new google.auth.OAuth2({
      clientId,
      clientSecret,
      redirectUri: `${getServerSideURL()}/api/users/auth/google/callback`,
    })
    console.log(
      'Starting Google OAuth flow, redirect URI:',
      `${getServerSideURL()}/api/users/auth/google/callback`,
    )

    try {
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = generateCodeChallenge(codeVerifier)

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        code_challenge: codeChallenge,
        code_challenge_method: CodeChallengeMethod.S256,
        prompt: consentFlag ? 'consent' : 'none',
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
        ],
      })

      const domain =
        isProduction && hostname ? hostname.replace(/^https?:\/\//, '').split(':')[0] : undefined

      const cookieParts = [
        `codeVerifier=${codeVerifier}`,
        'Path=/',
        'HttpOnly',
        'Max-Age=300',
        'SameSite=Lax',
        isProduction ? 'Secure' : '',
        domain ? `Domain=${domain}` : '',
      ].filter(Boolean)

      const cookieHeader = cookieParts.join('; ')

      if (consentFlag) {
        return new Response(null, {
          headers: {
            Location: authUrl,
            'Set-Cookie': cookieHeader,
          },
          status: 302,
        })
      }

      return new Response(JSON.stringify({ url: authUrl }), {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
        status: 200,
      })
    } catch (error) {
      console.error('Authentication error:', error)
      return new Response(JSON.stringify({ error: 'Failed to authenticate' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      })
    }
  },
  method: 'get',
  path: '/auth/google',
}

interface AuthResult {
  permissions: SanitizedPermissions
  responseHeaders?: Headers
  user:
    | null
    | (TypedUser & {
        _sid?: string
        _strategy?: string
        collection: 'users'
      })
}

export const googleCallback: Endpoint = {
  handler: async (req: PayloadRequest): Promise<Response> => {
    try {
      const payload = await getPayload({ config: configPromise })

      const url = new URL(req.url ?? getServerSideURL())
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      const clearCookie = [
        'codeVerifier=',
        'Path=/',
        'HttpOnly',
        'Max-Age=0',
        'SameSite=Lax',
        isProduction ? 'Secure' : '',
      ]
        .filter(Boolean)
        .join('; ')

      const cookie = parseCookies(req.headers)
      const codeVerifier = cookie.get('codeVerifier')

      if (
        error === 'interaction_required' ||
        error === 'login_required' ||
        error === 'consent_required'
      ) {
        return new Response(null, {
          headers: {
            Location: `${getServerSideURL()}/api/users/auth/google?force_consent=true`,
            'Set-Cookie': clearCookie,
          },
          status: 302,
        })
      }

      const errorRedirect = (reason: string) =>
        new Response(null, {
          headers: {
            Location: `${getServerSideURL()}/login?error=${reason}`,
            'Set-Cookie': clearCookie,
          },
          status: 302,
        })

      if (!code || !codeVerifier) {
        console.error('Missing OAuth parameters', { code, codeVerifier })
        return errorRedirect('missing_parameters')
      }

      const authResult = await payload.auth({
        headers: new Headers({
          'x-auth-strategy': 'google',
          'x-oauth-code': code,
          'x-oauth-verifier': codeVerifier,
        }),
      })

      const { user } = authResult as AuthResult

      if (!user) {
        console.error('Authentication failed: No user returned')
        return errorRedirect('auth_failed')
      }

      const collection = payload.collections['users']
      const authConfig = collection.config.auth
      const secret = crypto
        .createHash('sha256')
        .update(payload.config.secret)
        .digest('hex')
        .slice(0, 32)

      const { token } = await jwtSign({
        fieldsToSign: {
          _strategy: user._strategy ?? undefined,
          collection: 'users',
          email: user.email,
          id: user.id,
          sid: user._sid ?? undefined,
        },
        secret,
        tokenExpiration: authConfig.tokenExpiration,
      })

      const cookies = generatePayloadCookie({
        collectionAuthConfig: authConfig,
        cookiePrefix: payload.config.cookiePrefix,
        token: token!,
      })

      return new Response(null, {
        headers: {
          Location: `${getServerSideURL()}/`,
          'Set-Cookie': cookies,
        },
        status: 302,
      })
    } catch (err) {
      console.error('Google OAuth callback error:', err)
      const clearCookie = [
        'codeVerifier=',
        'Path=/',
        'HttpOnly',
        'Max-Age=0',
        'SameSite=Lax',
        isProduction ? 'Secure' : '',
      ]
        .filter(Boolean)
        .join('; ')

      return new Response(null, {
        headers: {
          Location: `${getServerSideURL()}/login?error=oauth_failed`,
          'Set-Cookie': clearCookie,
        },
        status: 302,
      })
    }
  },
  method: 'get',
  path: '/auth/google/callback',
}
