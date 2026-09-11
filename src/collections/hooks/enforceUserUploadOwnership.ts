import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'
import type { TFunction } from '@payloadcms/translations'
import type { User } from '@/payload-types'
import { checkRole } from '../access/checkRole'
import type { CustomTranslationsKeys } from '@/translations'
import { relationId } from '@/lib/relationId'

/**
 * Не дає користувачу поставити собі аватар/банер із чужого завантаження.
 *
 * Раніше цю дірку закривало те, що завантажувати могли лише покровителі —
 * тепер аватари відкриті всім, тож посилання на файл перевіряємо явно:
 * `avatar`/`banner` мають вказувати на запис у `user-uploads`, власником
 * якого є сам користувач. Адмінів не обмежуємо.
 */
export const enforceUserUploadOwnership: CollectionBeforeValidateHook<User> = async ({
  data = {},
  originalDoc,
  req,
}) => {
  const user = req.user

  if (!user || checkRole(['admin'], user)) {
    return data
  }

  const t = req.t as TFunction<CustomTranslationsKeys>

  for (const field of ['avatar', 'banner'] as const) {
    if (!(field in data)) continue

    const uploadId = relationId(data[field])

    // Зняття аватара/банера перевіряти нічого
    if (!uploadId) continue

    // Значення не змінилося — не ганяємо зайвий запит у базу
    if (originalDoc && relationId(originalDoc[field]) === uploadId) continue

    let ownerId: string | null = null

    try {
      const upload = await req.payload.findByID({
        collection: 'user-uploads',
        id: uploadId,
        depth: 0,
        overrideAccess: true,
      })
      ownerId = relationId(upload?.owner)
    } catch {
      ownerId = null
    }

    if (!ownerId || ownerId !== String(user.id)) {
      throw new APIError(t('uploads:notFileOwner'), 403)
    }
  }

  return data
}
