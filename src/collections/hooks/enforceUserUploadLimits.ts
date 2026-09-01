import type { CollectionBeforeValidateHook, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'
import type { TFunction } from '@payloadcms/translations'
import type { UserUpload } from '@/payload-types'
import { checkRole } from '../access/checkRole'
import type { CustomTranslationsKeys } from '@/translations'
import {
  DEFAULT_USER_UPLOAD_LIMIT,
  DEFAULT_USER_UPLOAD_MAX_FILE_SIZE_MB,
  DEFAULT_USER_UPLOAD_MIN_ACCOUNT_AGE_DAYS,
  DEFAULT_USER_UPLOAD_RATE_LIMIT,
  USER_UPLOAD_ALLOWED_MIME_TYPES,
  mbToBytes,
} from '@/lib/uploadLimits'
import { daysUntilUploadsUnlocked } from '@/lib/userUploadAccess'

const HOUR_IN_MS = 60 * 60 * 1000

/**
 * Захист колекції `user-uploads` (аватари й банери) від зловживань.
 *
 * Завантажувати може будь-який авторизований користувач, тож перевірки тут —
 * єдине, що стоїть між сховищем і охочим його забити. Робить чотири речі:
 *
 * 1. Форсує власника (`owner`) поточним користувачем на створенні й не дає
 *    переписати його на апдейті. Field-level access на полі відкидає значення
 *    з форми ще до цього хука, а хук проставляє справжнє (хуки колекції
 *    виконуються після field access, тому значення доживає до запису).
 * 2. Перевіряє тип файлу — лише зображення з білого списку.
 * 3. Перевіряє розмір файлу — ліміт із глобалу «Загальні налаштування».
 * 4. Обмежує кількість файлів на користувача та швидкість завантажень
 *    (N на годину), щоб не можна було наливати файли в циклі.
 * 5. Пускає до завантажень лише акаунти, старші за N днів. Пошта зараз не
 *    підтверджується, тож без цього аватар міг би поставити хто завгодно
 *    із щойно створеного одноразового акаунта. Ролі, які видає людина
 *    (editor/writer/supporter), чекати не мусять.
 *
 * Адмінів це все не стосується.
 */
export const enforceUserUploadLimits: CollectionBeforeValidateHook<UserUpload> = async ({
  data = {},
  operation,
  req,
}) => {
  const user = req.user
  const t = req.t as TFunction<CustomTranslationsKeys>

  // Локальні виклики без користувача (сіди, скрипти) не чіпаємо —
  // до них не дістатися ззовні, доступ уже перевірено access-контролем
  if (!user) {
    return data
  }

  const isAdmin = checkRole(['admin'], user)

  if (operation === 'create') {
    if (!isAdmin) {
      data.owner = user.id
    }
  } else if (!isAdmin) {
    // Власника змінювати не можна — інакше можна було б «подарувати»
    // свій файл іншому користувачу або перехопити чужий
    delete data.owner
  }

  if (isAdmin) {
    return data
  }

  const settings = await req.payload.findGlobal({
    slug: 'general-settings',
    depth: 0,
  })

  if (operation === 'create') {
    const minAccountAgeDays =
      typeof settings?.userUploadMinAccountAgeDays === 'number'
        ? settings.userUploadMinAccountAgeDays
        : DEFAULT_USER_UPLOAD_MIN_ACCOUNT_AGE_DAYS

    // createdAt приходить разом із користувачем; підстраховуємось на випадок
    // стратегії автентифікації, яка віддає врізаний документ
    const account = user.createdAt
      ? user
      : await req.payload.findByID({
          collection: 'users',
          id: user.id,
          depth: 0,
          overrideAccess: true,
        })

    const daysLeft = daysUntilUploadsUnlocked(account, minAccountAgeDays)

    if (daysLeft > 0) {
      throw new APIError(
        t('uploads:accountTooNew', { days: minAccountAgeDays, remaining: daysLeft }),
        403,
      )
    }
  }

  const maxFileSizeMb =
    typeof settings?.userUploadMaxFileSize === 'number'
      ? settings.userUploadMaxFileSize
      : DEFAULT_USER_UPLOAD_MAX_FILE_SIZE_MB

  // Файл присутній і на створенні, і на заміні файлу в існуючому документі
  const file = req.file

  if (operation === 'create' && !file) {
    throw new APIError(t('uploads:fileRequired'), 400)
  }

  if (file) {
    if (!USER_UPLOAD_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new APIError(
        t('uploads:invalidFileType', { types: USER_UPLOAD_ALLOWED_MIME_TYPES.join(', ') }),
        415,
      )
    }

    if (file.size > mbToBytes(maxFileSizeMb)) {
      throw new APIError(t('uploads:fileTooLarge', { limit: maxFileSizeMb }), 413)
    }
  }

  if (operation !== 'create') {
    return data
  }

  const rateLimit =
    typeof settings?.userUploadRateLimit === 'number'
      ? settings.userUploadRateLimit
      : DEFAULT_USER_UPLOAD_RATE_LIMIT

  const { totalDocs: recentUploads } = await req.payload.count({
    collection: 'user-uploads',
    where: {
      and: [
        { owner: { equals: user.id } },
        { createdAt: { greater_than: new Date(Date.now() - HOUR_IN_MS).toISOString() } },
      ],
    },
  })

  if (recentUploads >= rateLimit) {
    throw new APIError(t('uploads:tooManyUploads', { limit: rateLimit }), 429)
  }

  const limit =
    typeof settings?.userUploadLimit === 'number'
      ? settings.userUploadLimit
      : DEFAULT_USER_UPLOAD_LIMIT

  const { totalDocs } = await req.payload.count({
    collection: 'user-uploads',
    where: {
      owner: { equals: user.id },
    },
  })

  if (totalDocs >= limit) {
    // Перш ніж відмовляти — прибираємо «сироти»: файли, які вже не стоять
    // ні аватаром, ні банером (наприклад, після невдалого другого запиту).
    // Інакше користувач опинився б у глухому куті: ліміт вичерпано, а видалити
    // зайве з інтерфейсу нема як.
    const removed = await deleteOrphanUploads(req, String(user.id))

    if (totalDocs - removed >= limit) {
      throw new APIError(t('uploads:uploadLimitReached', { limit }), 403)
    }
  }

  return data
}

/**
 * Видаляє завантаження користувача, на які вже ніщо не посилається
 * (не аватар і не банер). Повертає кількість видалених.
 */
const deleteOrphanUploads = async (req: PayloadRequest, userId: string): Promise<number> => {
  try {
    const owner = await req.payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      overrideAccess: true,
    })

    const keep = [owner?.avatar, owner?.banner]
      .map((value) => (typeof value === 'object' && value !== null ? value.id : value))
      .filter((value): value is string => typeof value === 'string')

    const where: Where = { owner: { equals: userId } }
    if (keep.length > 0) {
      where.id = { not_in: keep }
    }

    const { docs } = await req.payload.delete({
      collection: 'user-uploads',
      where,
      overrideAccess: true,
      req,
    })

    return docs.length
  } catch (error) {
    // Прибирання — не критичне: якщо не вийшло, просто спрацює ліміт
    req.payload.logger.error(
      `Failed to clean up orphan user uploads for ${userId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    return 0
  }
}
