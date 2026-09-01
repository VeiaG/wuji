import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { authenticated } from './access/authenticated'
import { adminsFieldAccess } from './access/admins'
import adminsAndUserByField from './access/adminsAndUserByField'
import { hiddenUnlessRole } from './access/hidden'
import { enforceUserUploadLimits } from './hooks/enforceUserUploadLimits'
import {
  MAX_INPUT_PIXELS,
  USER_UPLOAD_ALLOWED_MIME_TYPES,
  USER_UPLOAD_MAX_DIMENSION,
} from '@/lib/uploadLimits'

export const UserUploads: CollectionConfig = {
  slug: 'user-uploads',
  labels: {
    singular: {
      en: 'User Upload',
      uk: 'Завантаження користувача',
    },
    plural: {
      en: 'User Uploads',
      uk: 'Завантаження користувачів',
    },
  },
  admin: {
    // аватари/банери користувачів — read-only з боку адмінки, ховаємо від усіх крім admin
    hidden: hiddenUnlessRole(['admin']),
  },
  access: {
    read: anyone,
    // аватар і банер — більше не перк покровителя, завантажити може будь-хто
    // авторизований; від зловживань захищає enforceUserUploadLimits
    create: authenticated,
    update: adminsAndUserByField('owner'),
    delete: adminsAndUserByField('owner'),
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
      },
      access: {
        // значення форсується сервером у enforceUserUploadLimits —
        // передати чужого власника з форми не можна (лише адмін)
        create: adminsFieldAccess,
        update: adminsFieldAccess,
      },
    },
  ],
  hooks: {
    beforeValidate: [enforceUserUploadLimits],
  },
  upload: {
    // лише зображення; решту Payload відкине ще до запису
    mimeTypes: [...USER_UPLOAD_ALLOWED_MIME_TYPES],
    filesRequiredOnCreate: true,
    // приводимо все до WebP і обмежуємо розміри — і сховище, і трафік
    // залишаються передбачуваними, чим би користувач не «вистрелив».
    // Побічний ефект: анімовані GIF стають статичними.
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
    resizeOptions: {
      width: USER_UPLOAD_MAX_DIMENSION,
      height: USER_UPLOAD_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    },
    // стеля на кількість пікселів вхідного файлу — захист від
    // «декомпресійних бомб» (маленький файл, величезне полотно)
    constructorOptions: {
      limitInputPixels: MAX_INPUT_PIXELS,
    },
  },
}
