import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'
import type { TFunction } from '@payloadcms/translations'
import type { Media } from '@/payload-types'
import { checkRole } from '../access/checkRole'
import type { CustomTranslationsKeys } from '@/translations'

const DEFAULT_MEDIA_UPLOAD_LIMIT = 10

/**
 * Записує авторство медіа та перевіряє ліміт завантажень для не-адмінів.
 *
 * - Авторство (`author`) проставляється лише коли медіа створює НЕ адмін
 *   (editor/writer). Значення форсується сервером; спуфнуті значення з форми
 *   відсікаються field-level access контролем на полі `author`.
 * - Ліміт береться з глобалу "Загальні налаштування" (`general-settings`),
 *   поле `mediaUploadLimit` (за замовчуванням 10). Якщо в користувача вже
 *   стільки ж або більше власних медіа — створення блокується.
 *
 * Адмінів це не стосується (без авторства й без ліміту).
 */
export const enforceMediaAuthorLimit: CollectionBeforeValidateHook<Media> = async ({
  data = {},
  operation,
  req,
}) => {
  const user = req.user

  // Тільки створення не-адмінами; адмінів не обмежуємо й авторство не пишемо
  if (operation !== 'create' || !user || checkRole(['admin'], user)) {
    return data
  }

  // Форсуємо авторство поточним користувачем (editor/writer)
  data.author = user.id

  // Ліміт із глобалу; overrideAccess за замовчуванням true при виклику без req
  const settings = await req.payload.findGlobal({
    slug: 'general-settings',
    depth: 0,
  })
  const limit =
    typeof settings?.mediaUploadLimit === 'number'
      ? settings.mediaUploadLimit
      : DEFAULT_MEDIA_UPLOAD_LIMIT

  // Скільки медіа вже створив цей користувач
  const { totalDocs } = await req.payload.count({
    collection: 'media',
    where: {
      author: {
        equals: user.id,
      },
    },
  })

  if (totalDocs >= limit) {
    const t = req.t as TFunction<CustomTranslationsKeys>
    throw new APIError(t('media:uploadLimitReached', { limit }), 403)
  }

  return data
}
