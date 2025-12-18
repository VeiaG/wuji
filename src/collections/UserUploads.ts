import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { admins } from './access/admins'
import { supporters } from './access/supporters'
import adminsAndUserByField from './access/adminsAndUserByField'

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
