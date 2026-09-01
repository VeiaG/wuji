import type { User } from '@/payload-types'
import { checkRole } from '@/collections/access/checkRole'
import { DEFAULT_USER_UPLOAD_MIN_ACCOUNT_AGE_DAYS } from './uploadLimits'

const DAY_IN_MS = 24 * 60 * 60 * 1000

/**
 * Ролі, яким вік акаунта не важливий: їх видає людина вручну,
 * тож одноразовим акаунтом вони бути не можуть.
 */
const TRUSTED_UPLOADER_ROLES: NonNullable<User['roles']> = [
  'admin',
  'editor',
  'writer',
  'supporter',
]

export const isTrustedUploader = (user: User | null | undefined): boolean =>
  checkRole(TRUSTED_UPLOADER_ROLES, user ?? null)

/**
 * Скільки днів лишилось акаунту до можливості завантажити аватар/банер.
 * 0 — можна вже зараз.
 *
 * Спільна логіка для клієнта (показати, коли відкриється) і сервера
 * (не пустити раніше часу).
 */
export const daysUntilUploadsUnlocked = (
  user: User | null | undefined,
  minAccountAgeDays: number = DEFAULT_USER_UPLOAD_MIN_ACCOUNT_AGE_DAYS,
): number => {
  if (!user) return minAccountAgeDays
  if (minAccountAgeDays <= 0 || isTrustedUploader(user)) return 0

  const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : NaN

  // Дати немає або вона побита — вирішує сервер, клієнту не блокуємо
  if (Number.isNaN(createdAt)) return 0

  const ageInDays = Math.floor((Date.now() - createdAt) / DAY_IN_MS)

  return Math.max(0, minAccountAgeDays - ageInDays)
}

export const canUploadUserFiles = (
  user: User | null | undefined,
  minAccountAgeDays?: number,
): boolean => daysUntilUploadsUnlocked(user, minAccountAgeDays) === 0
