import { User } from '@/payload-types'
import { Permissions } from 'payload'

export type ResetPassword = (args: {
  password: string
  passwordConfirm: string
  token: string
}) => Promise<User>

export type ForgotPassword = (args: { email: string }) => Promise<User>

export type Create = (args: {
  email: string
  firstName: string
  lastName: string
  password: string
}) => Promise<User>

export type Login = (args: { email: string; password: string }) => Promise<User>

export type Logout = () => Promise<void>

// Resolves true when the token was successfully renewed, false otherwise
// (network error, expired token, unexpected response) so callers can retry.
export type RefreshToken = () => Promise<boolean>

export interface AuthContext {
  create: Create
  // Unix timestamp (in seconds) when the current auth token expires, or null if unknown.
  exp?: null | number
  forgotPassword: ForgotPassword
  login: Login
  logout: Logout
  permissions?: null | Permissions
  refreshToken: RefreshToken
  resetPassword: ResetPassword
  setPermissions: (permissions: null | Permissions) => void
  setUser: (user: null | User) => void
  user?: null | User
}
