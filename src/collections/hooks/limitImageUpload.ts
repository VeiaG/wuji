import { writeFile } from 'fs/promises'
import type { CollectionBeforeOperationHook } from 'payload'
import { APIError } from 'payload'
import sharp from 'sharp'
import { MAX_INPUT_PIXELS } from '@/lib/uploadLimits'

const UPLOAD_OPERATIONS = new Set(['create', 'update', 'updateByID'])

type LimitImageUploadOptions = {
  /** Найбільша сторона після зменшення; менші зображення не збільшуються */
  maxDimension: number
  /** Перекодувати в WebP (інакше формат лишається вхідним) */
  webp?: { quality: number }
}

/**
 * Обмежує вхідне зображення ще до того, як Payload його збереже: зменшує до
 * `maxDimension`, за потреби перекодовує в WebP, застосовує орієнтацію з EXIF і
 * прибирає метадані (GPS, модель камери тощо — sharp не переносить їх без withMetadata).
 *
 * Чому не `resizeOptions` / `formatOptions` у sharpTransformer: у Payload 4 трансформер
 * будує головний файл як похідний (на кшталт розміру), а необроблений оригінал зберігає
 * окремим об'єктом (`doc.original`). Нам оригінали не потрібні, а в публічному бакеті R2
 * вони ще й з метаданими. Тут ми замінюємо сам вхідний файл, як це робив v3, тож
 * зберігається лише один файл.
 *
 * Типи, яких колекція не приймає, не чіпаємо: інакше перекодування в WebP обійшло б
 * перевірку `upload.mimeTypes`. Анімовані GIF стають статичними (перший кадр), як і раніше.
 */
export const limitImageUpload =
  ({ maxDimension, webp }: LimitImageUploadOptions): CollectionBeforeOperationHook =>
  async ({ args, collection, operation, req }) => {
    const file = req.file
    if (!UPLOAD_OPERATIONS.has(operation) || !file) return args

    const allowed = typeof collection.upload === 'object' ? collection.upload.mimeTypes : undefined
    if (!file.mimetype.startsWith('image/') || file.mimetype === 'image/svg+xml') return args
    if (allowed?.length && !allowed.includes(file.mimetype)) return args

    const input = file.data?.length ? file.data : file.tempFilePath
    if (!input) return args

    let output: Buffer
    try {
      const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
        .rotate()
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
      output = await (webp ? image.webp({ quality: webp.quality }) : image).toBuffer()
    } catch {
      throw new APIError('Не вдалося обробити зображення', 400)
    }

    if (file.data?.length) {
      file.data = output
    } else if (file.tempFilePath) {
      await writeFile(file.tempFilePath, output)
    }
    file.size = output.length
    if (webp && file.mimetype !== 'image/webp') {
      file.mimetype = 'image/webp'
      file.name = `${file.name.replace(/\.[^./\\]+$/, '') || 'image'}.webp`
    }
    return args
  }
