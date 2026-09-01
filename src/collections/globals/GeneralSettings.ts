import { GlobalConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'
import { hiddenUnlessRole } from '../access/hidden'
import {
  DEFAULT_MEDIA_MAX_FILE_SIZE_MB,
  DEFAULT_USER_UPLOAD_LIMIT,
  DEFAULT_USER_UPLOAD_MAX_FILE_SIZE_MB,
  DEFAULT_USER_UPLOAD_RATE_LIMIT,
  MAX_UPLOAD_FILE_SIZE_MB,
} from '@/lib/uploadLimits'

/**
 * Глобал "Загальні налаштування" — місце для загальних, не прив'язаних до
 * конкретної колекції параметрів сайту. Зроблено на вкладках, щоб у майбутньому
 * було куди додавати нові групи налаштувань без розростання одного списку.
 *
 * Вкладка "Медіа" — ліміти для не-адмінів (editor/writer), бо диск не резиновий.
 * Вкладка "Завантаження користувачів" — ліміти на аватари/банери, які тепер
 * може завантажувати будь-який зареєстрований користувач.
 */
const GeneralSettings: GlobalConfig = {
  slug: 'general-settings',
  label: {
    en: 'General Settings',
    uk: 'Загальні налаштування',
  },
  admin: {
    // read-only для не-адмінів (update: admins) — ховаємо з навігації
    hidden: hiddenUnlessRole(['admin']),
  },
  access: {
    read: anyone,
    update: admins,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: {
            en: 'Media',
            uk: 'Медіа',
          },
          fields: [
            {
              name: 'mediaUploadLimit',
              type: 'number',
              required: true,
              defaultValue: 10,
              min: 0,
              label: {
                en: 'Media upload limit per user',
                uk: 'Ліміт завантажень медіа на користувача',
              },
              admin: {
                description: {
                  en: 'Maximum number of media files a non-admin user (editor/writer) may upload. Admins are not limited.',
                  uk: 'Максимальна кількість медіафайлів, які може завантажити не-адмін (editor/writer). На адмінів ліміт не діє.',
                },
              },
            },
            {
              name: 'mediaMaxFileSize',
              type: 'number',
              required: true,
              defaultValue: DEFAULT_MEDIA_MAX_FILE_SIZE_MB,
              min: 1,
              max: MAX_UPLOAD_FILE_SIZE_MB,
              label: {
                en: 'Max media file size (MB)',
                uk: 'Максимальний розмір медіафайлу (МБ)',
              },
              admin: {
                description: {
                  en: `Applies to non-admins (editor/writer). Hard ceiling for any upload is ${MAX_UPLOAD_FILE_SIZE_MB} MB.`,
                  uk: `Діє на не-адмінів (editor/writer). Жорстка стеля для будь-якого завантаження — ${MAX_UPLOAD_FILE_SIZE_MB} МБ.`,
                },
              },
            },
          ],
        },
        {
          label: {
            en: 'User uploads',
            uk: 'Завантаження користувачів',
          },
          fields: [
            {
              name: 'userUploadLimit',
              type: 'number',
              required: true,
              defaultValue: DEFAULT_USER_UPLOAD_LIMIT,
              min: 0,
              label: {
                en: 'Stored files per user',
                uk: 'Файлів на користувача',
              },
              admin: {
                description: {
                  en: 'How many avatar/banner files one user may keep at once. Old files are deleted automatically when replaced, so a small number is enough.',
                  uk: 'Скільки файлів аватара/банера користувач може тримати одночасно. Старі файли видаляються автоматично при заміні, тож малого числа вистачає.',
                },
              },
            },
            {
              name: 'userUploadMaxFileSize',
              type: 'number',
              required: true,
              defaultValue: DEFAULT_USER_UPLOAD_MAX_FILE_SIZE_MB,
              min: 1,
              max: MAX_UPLOAD_FILE_SIZE_MB,
              label: {
                en: 'Max avatar/banner file size (MB)',
                uk: 'Максимальний розмір аватара/банера (МБ)',
              },
              admin: {
                description: {
                  en: 'Images are additionally downscaled and re-encoded to WebP on the server, so the stored file is usually much smaller.',
                  uk: 'Зображення додатково зменшуються та перекодовуються у WebP на сервері, тож збережений файл зазвичай значно менший.',
                },
              },
            },
            {
              name: 'userUploadRateLimit',
              type: 'number',
              required: true,
              defaultValue: DEFAULT_USER_UPLOAD_RATE_LIMIT,
              min: 1,
              label: {
                en: 'Uploads per hour per user',
                uk: 'Завантажень на годину на користувача',
              },
              admin: {
                description: {
                  en: 'Protects storage from a user who repeatedly uploads and replaces files. Admins are not limited.',
                  uk: 'Захищає сховище від користувача, який раз за разом завантажує й замінює файли. На адмінів ліміт не діє.',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}

export default GeneralSettings
