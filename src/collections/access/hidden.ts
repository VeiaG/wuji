import { User } from '@/payload-types'
import { checkRole } from './checkRole'
import type { AuthenticatedUser } from 'payload'

/**
 * Фабрика для `admin.hidden` на колекціях та глобалах.
 * Ховає пункт з навігації адмінки, якщо в користувача немає жодної з переданих ролей.
 *
 * УВАГА: це виключно UI — реальний доступ (read/create/update/delete) все одно
 * контролюється через `access`. Використовуємо, щоб прибрати з навігації read-only
 * колекції, які editor/writer все одно не можуть редагувати.
 */
export const hiddenUnlessRole =
  (roles: User['roles']) =>
  // глобали (з 3.91) передають серверного `User`, колекції — `AuthenticatedUser`
  ({ user }: { user?: AuthenticatedUser | User | null }): boolean =>
    !user || !checkRole(roles, user as unknown as User)
