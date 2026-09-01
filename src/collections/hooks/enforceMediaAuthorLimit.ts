import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'
import type { TFunction } from '@payloadcms/translations'
import type { Media } from '@/payload-types'
import { checkRole } from '../access/checkRole'
import type { CustomTranslationsKeys } from '@/translations'
import {
  DEFAULT_MEDIA_MAX_FILE_SIZE_MB,
  MEDIA_ALLOWED_MIME_TYPES,
  mbToBytes,
} from '@/lib/uploadLimits'

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
 * - Файл перевіряється за типом і розміром (`mediaMaxFileSize`), щоб
 *   завантаженням не можна було забити диск.
 *
 * Адмінів це не стосується (без авторства й без ліміту).
 */
export const enforceMediaAuthorLimit: CollectionBeforeValidateHook<Media> = async ({
  data = {},
  operation,
  req,
}) => {
  const user = req.user

  // Не-адміни; адмінів не обмежуємо й авторство не пишемо
  if (!user || checkRole(['admin'], user)) {
    return data
  }

  const t = req.t as TFunction<CustomTranslationsKeys>

  // Ліміти з глобалу; overrideAccess за замовчуванням true при виклику без req
  const settings = await req.payload.findGlobal({
    slug: 'general-settings',
    depth: 0,
  })

  // Файл є і на створенні, і на заміні файлу в наявному медіа
  const file = req.file

  if (file) {
    if (!MEDIA_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new APIError(
        t('uploads:invalidFileType', { types: MEDIA_ALLOWED_MIME_TYPES.join(', ') }),
        415,
      )
    }

    const maxFileSizeMb =
      typeof settings?.mediaMaxFileSize === 'number'
        ? settings.mediaMaxFileSize
        : DEFAULT_MEDIA_MAX_FILE_SIZE_MB

    if (file.size > mbToBytes(maxFileSizeMb)) {
      throw new APIError(t('uploads:fileTooLarge', { limit: maxFileSizeMb }), 413)
    }
  }

  // Далі — лише про створення: авторство й ліміт кількості
  if (operation !== 'create') {
    return data
  }

  // Форсуємо авторство поточним користувачем (editor/writer)
  data.author = user.id

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
    throw new APIError(t('media:uploadLimitReached', { limit }), 403)
  }

  return data
}
