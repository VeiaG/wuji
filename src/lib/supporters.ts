import { User } from '@/payload-types'

/**
 * Badge type with priority
 */
export type UserBadge = {
  type: 'admin' | 'editor' | 'writer' | 'supporter' | 'reader'
  label: string
  priority: number
}

/**
 * Get user badges with priority (max 2 badges)
 * Priority order: Admin > Editor > Writer (Письменник) > Supporter (Покровитель Дао) > Reader (Читач)
 *
 * @param user - User object
 * @returns Array of max 2 badges in priority order
 */
export const getUserBadges = (user: User | null | undefined): UserBadge[] => {
  if (!user) return [{ type: 'reader', label: 'Читач', priority: 5 }]

  const roles = user.roles || []
  const badges: UserBadge[] = []

  // Add role badges by priority
  if (roles.includes('admin')) {
    badges.push({ type: 'admin', label: 'Адміністратор', priority: 1 })
  }
  if (roles.includes('editor')) {
    badges.push({ type: 'editor', label: 'Редактор', priority: 2 })
  }
  if (roles.includes('writer')) {
    badges.push({ type: 'writer', label: 'Письменник', priority: 3 })
  }
  if (roles.includes('supporter')) {
    badges.push({ type: 'supporter', label: 'Покровитель Дао', priority: 4 })
  }

  // Always add reader badge if we have less than 2 badges
  if (badges.length < 2) {
    badges.push({ type: 'reader', label: 'Читач', priority: 5 })
  }

  // Sort by priority and take first 2
  return badges.sort((a, b) => a.priority - b.priority).slice(0, 2)
}
