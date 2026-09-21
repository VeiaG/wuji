import type { PayloadRequest } from 'payload'

import { canAccessAdmin } from 'payload'

import type { ClientConfigAccess } from './types'

/**
 * За замовчуванням ендпоінти доступні тим самим користувачам, що й адмінка:
 * `canAccessAdmin` проганяє `access.admin` колекції з `admin.user` і кидає
 * `Unauthorized`, якщо не пройшло.
 *
 * Окремо перевіряємо `req.user`, бо `canAccessAdmin` свідомо пропускає аноніма,
 * поки в системі немає жодного користувача (сценарій створення першого).
 */
export const defaultAccess: ClientConfigAccess = async (req) => {
  if (!req.user) {
    return false
  }

  try {
    await canAccessAdmin({ req })

    return true
  } catch {
    return false
  }
}

/**
 * 401 для анонімів, 403 для залогінених без прав — щоб мобільний клієнт міг
 * відрізнити «треба перелогінитись» від «тобі сюди не можна».
 */
export const denyResponse = (req: PayloadRequest): Response =>
  req.user
    ? Response.json({ message: 'Forbidden' }, { status: 403 })
    : Response.json({ message: 'Unauthorized' }, { status: 401 })
