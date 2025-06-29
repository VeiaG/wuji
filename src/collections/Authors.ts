import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { admins } from './access/admins'

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: {
    singular: {
      en: 'Author',
      uk: 'Автор',
    },
    plural: {
      en: 'Authors',
      uk: 'Автори',
    },
  },
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      label: {
        en: 'Name',
        uk: "Ім'я",
      },
    },
  ],
}
