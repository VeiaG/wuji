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
import { appendCookie, clearCookie } from './cookie'

const clientId = process.env.GOOGLE_CLIENT_ID!
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!

export const googleAuth: Endpoint = {
  handler: async (req: PayloadRequest): Promise<Response> => {
    const url = new URL(req.url ?? '')
    const consentFlag = url.searchParams.get('force_consent') === 'true'

    const oauth2Client = new google.auth.OAuth2({
      clientId,
      clientSecret,
      redirectUri: `${getServerSideURL()}/api/users/auth/google/callback`,
    })

    try {
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = generateCodeChallenge(codeVerifier)
      const state = crypto.randomUUID()

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        code_challenge: codeChallenge,
        code_challenge_method: CodeChallengeMethod.S256,
        prompt: consentFlag ? 'consent' : 'none',
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
        ],
        state,
      })

      // codeVerifier: Used for PKCE validation during the token exchange
      // oauthState: Validated on callback to prevent CSRF and code injection
      // clientFlag: Carries routing intent so we know where to redirect the user
      const headers = new Headers()
      appendCookie(headers, 'codeVerifier', codeVerifier)
      appendCookie(headers, 'oauthState', state)

      headers.set('Location', authUrl.toString())
      return new Response(null, {
        headers,
        status: 302,
      })
    } catch {
      const headers = new Headers()
      headers.set('Location', `${getServerSideURL()}/login?error=oauth_failed`)
      return new Response(null, {
        headers,
        status: 302,
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
    const url = new URL(req.url ?? getServerSideURL())

    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    const state = url.searchParams.get('state')

    const cookie = parseCookies(req.headers)
    const codeVerifier = cookie.get('codeVerifier')
    const oauthState = cookie.get('oauthState')
    const clientFlag = cookie.get('clientFlag') === 'true'

    // Clear temporary OAuth cookies after they have been consumed.
    // This enforces single-use semantics for the login flow
    const headers = new Headers()
    clearCookie(headers, 'codeVerifier')
    clearCookie(headers, 'oauthState')
    clearCookie(headers, 'clientFlag')

    if (
      error === 'interaction_required' ||
      error === 'login_required' ||
      error === 'consent_required'
    ) {
      headers.set(
        'Location',
        `${getServerSideURL()}/api/users/auth/google?force_consent=true${clientFlag ? '&client_login=true' : ''}`,
      )
      return new Response(null, {
        headers,
        status: 302,
      })
    }

    const errorRedirect = (reason: string) => {
      headers.set(
        'Location',
        // 'client' can be adjusted to your client-facing login.
        `${getServerSideURL()}/login?error=${reason}`,
      )
      return new Response(null, {
        headers,
        status: 302,
      })
    }

    if (!state || !oauthState || state !== oauthState) {
      console.error('Invalid OAuth state', { oauthState, state })
      return errorRedirect('invalid_state')
    }

    if (!code || !codeVerifier) {
      console.error('Missing OAuth parameters', { code, codeVerifier })
      return errorRedirect('missing_parameters')
    }

    try {
      const payload = await getPayload({ config: configPromise })

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

      // 'client' can be adjusted to your client-facing dashboard.
      headers.set('Location', `${getServerSideURL()}/login`)
      headers.append('Set-Cookie', cookies)

      return new Response(null, {
        headers,
        status: 302,
      })
    } catch {
      headers.set(
        'Location',
        // 'client' can be adjusted to your client-facing login.
        `${getServerSideURL()}/login?error=oauth_failed`,
      )
      return new Response(null, {
        headers,
        status: 302,
      })
    }
  },
  method: 'get',
  path: '/auth/google/callback',
}
