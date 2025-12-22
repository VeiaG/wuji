import { User } from '@/payload-types'

/**
 * Client-side function to check if the user has supporter access
 * (supporter, editor, or admin role)
 */
export const isAllowedSupporter = (user: User | null | undefined): boolean => {
  if (!user) return false

  const roles = user.roles || []
  return roles.includes('admin') || roles.includes('supporter') || roles.includes('editor')
}

/**
 * Check if the user has only the supporter role (not admin or editor)
 */
export const isSupporterOnly = (user: User | null | undefined): boolean => {
  if (!user) return false

  const roles = user.roles || []
  return roles.includes('supporter') && !roles.includes('admin') && !roles.includes('editor')
}
