import type { PayloadRequest } from 'payload'
import { User } from '@/payload-types'
import { checkRole } from './checkRole'

/**
 * Tab-level access для payload-enhanced-sidebar.
 * Показуємо вкладку, лише якщо в користувача є одна з переданих ролей.
 *
 * Використовуємо тільки для вкладок, вужчих за admin/editor/writer
 * (напр. лише admin або admin+editor). Вкладки, доступні всім трьом
 * адмін-ролям, не гейтимо — інші ролі в адмінку й так не заходять.
 */
export const sidebarTabAccess =
  (roles: User['roles']) =>
  ({ req }: { req: PayloadRequest }): boolean =>
    checkRole(roles, (req.user as unknown as User) ?? null)
