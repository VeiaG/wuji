import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { admins } from './access/admins'

export const BookChapters: CollectionConfig = {
  slug: 'bookChapters',
  admin: {
    useAsTitle: 'title',
  },
  orderable: true,
  defaultSort: '_order',
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
      required: true,
      index: true,
    },
    {
      name: 'isSpoiler',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'addedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'book',
      type: 'relationship',
      relationTo: 'books',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
