import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { admins } from './access/admins'
import { hiddenUnlessRole } from './access/hidden'
import { FILE_ALLOWED_MIME_TYPES } from '@/lib/uploadLimits'

// Вкладення для постів (PDF, EPUB, архіви…) — вставляються через UploadFeature.
// Окремо від media, бо та свідомо приймає лише зображення
export const Files: CollectionConfig = {
  slug: 'files',
  labels: {
    singular: {
      en: 'File',
      uk: 'Файл',
    },
    plural: {
      en: 'Files',
      uk: 'Файли',
    },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'filename', 'mimeType', 'filesize'],
    hidden: hiddenUnlessRole(['admin']),
  },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: {
        en: 'Title',
        uk: 'Назва',
      },
      admin: {
        description: {
          en: 'Shown instead of the file name in posts.',
          uk: 'Показується в постах замість імені файлу.',
        },
      },
    },
  ],
  upload: {
    mimeTypes: [...FILE_ALLOWED_MIME_TYPES],
  },
}
