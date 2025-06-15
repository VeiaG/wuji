import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { admins } from './access/admins'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: {
      en: 'Media',
      uk: 'Медіа',
    },
    plural: {
      en: 'Media',
      uk: 'Медіа',
    },
  },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      // required: true,
    },
  ],
  upload: true,
}
