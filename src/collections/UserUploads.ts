import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { supporters } from './access/supporters'
import adminsAndUserByField from './access/adminsAndUserByField'
import { hiddenUnlessRole } from './access/hidden'

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
    create: supporters,
    update: adminsAndUserByField('owner'),
    delete: adminsAndUserByField('owner'),
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
  ],
  upload: true,
}
