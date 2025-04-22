import type { CollectionConfig } from 'payload'

export const BookChapters: CollectionConfig = {
  slug: 'bookChapters',
  admin: {
    useAsTitle: 'title',
  },
  orderable: true,
  defaultSort: '_order',
  access: {
    read: () => true, //Кожен може читати глави , для списку глав (який не працює без авторизації)
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
