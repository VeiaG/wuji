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

/**
 * Badge type with priority
 */
export type UserBadge = {
  type: 'admin' | 'editor' | 'supporter' | 'reader'
  label: string
  priority: number
}

/**
 * Get user badges with priority (max 2 badges)
 * Priority order: Admin > Editor > Supporter (Покровитель Дао) > Reader (Читач)
 *
 * @param user - User object
 * @returns Array of max 2 badges in priority order
 */
export const getUserBadges = (user: User | null | undefined): UserBadge[] => {
  if (!user) return [{ type: 'reader', label: 'Читач', priority: 4 }]

  const roles = user.roles || []
  const badges: UserBadge[] = []

  // Add role badges by priority
  if (roles.includes('admin')) {
    badges.push({ type: 'admin', label: 'Адміністратор', priority: 1 })
  }
  if (roles.includes('editor')) {
    badges.push({ type: 'editor', label: 'Редактор', priority: 2 })
  }
  if (roles.includes('supporter')) {
    badges.push({ type: 'supporter', label: 'Покровитель Дао', priority: 3 })
  }

  // Always add reader badge if we have less than 2 badges
  if (badges.length < 2) {
    badges.push({ type: 'reader', label: 'Читач', priority: 4 })
  }

  // Sort by priority and take first 2
  return badges.sort((a, b) => a.priority - b.priority).slice(0, 2)
}
