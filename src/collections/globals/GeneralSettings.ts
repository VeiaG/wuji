import { GlobalConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'
import { hiddenUnlessRole } from '../access/hidden'

/**
 * Глобал "Загальні налаштування" — місце для загальних, не прив'язаних до
 * конкретної колекції параметрів сайту. Зроблено на вкладках, щоб у майбутньому
 * було куди додавати нові групи налаштувань без розростання одного списку.
 *
 * Наразі містить вкладку "Медіа" з лімітом завантажень для не-адмінів
 * (editor/writer), бо диск на сервері не резиновий (без R2/S3).
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
          ],
        },
      ],
    },
  ],
}

export default GeneralSettings
