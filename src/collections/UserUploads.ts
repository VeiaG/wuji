import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { authenticated } from './access/authenticated'
import { adminsFieldAccess } from './access/admins'
import adminsAndUserByField from './access/adminsAndUserByField'
import { hiddenUnlessRole } from './access/hidden'
import { enforceUserUploadLimits } from './hooks/enforceUserUploadLimits'
import { limitImageUpload } from './hooks/limitImageUpload'
import { USER_UPLOAD_ALLOWED_MIME_TYPES, USER_UPLOAD_MAX_DIMENSION } from '@/lib/uploadLimits'

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
      // Поле обовʼязкове, а field access нижче зрізає значення з форми ще до
      // хуків колекції. Щоб не лишити його порожнім (і не впертись у
      // «Наступне поле невірне: Owner»), підставляємо поточного користувача
      // тут: Payload бере defaultValue одразу після access control, тож
      // значення є ще до валідації, незалежно від порядку хуків.
      // На оновленні defaultValue не застосовується — там виграє те, що вже
      // лежить у документі.
      defaultValue: ({ req }) => req?.user?.id,
      admin: {
        readOnly: true,
      },
      access: {
        // значення форсується сервером (defaultValue + enforceUserUploadLimits) —
        // передати чужого власника з форми не можна (лише адмін)
        create: adminsFieldAccess,
        update: adminsFieldAccess,
      },
    },
  ],
  hooks: {
    // приводимо все до WebP і обмежуємо розміри — і сховище, і трафік лишаються
    // передбачуваними, чим би користувач не «вистрелив». Побічний ефект: анімовані
    // GIF стають статичними.
    beforeOperation: [
      limitImageUpload({ maxDimension: USER_UPLOAD_MAX_DIMENSION, webp: { quality: 82 } }),
    ],
    beforeValidate: [enforceUserUploadLimits],
  },
  upload: {
    // лише зображення; решту Payload відкине ще до запису
    mimeTypes: [...USER_UPLOAD_ALLOWED_MIME_TYPES],
    filesRequiredOnCreate: true,
    // Ресайз і WebP — у limitImageUpload (hooks.beforeOperation), а не в sharpTransformer:
    // трансформер v4 зберігав би ще й необроблений оригінал
  },
  versions: false,
  authorship: false,
}
