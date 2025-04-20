import type { CollectionConfig } from 'payload'

export const BookChapters: CollectionConfig = {
  slug: 'bookChapters',
  admin: {
    useAsTitle: 'title',
  },
  orderable: true,
  defaultSort: '_order',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
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
