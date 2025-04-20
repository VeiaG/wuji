import type { CollectionConfig } from 'payload'

export const BookGenres: CollectionConfig = {
  slug: 'bookGenres',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
    },
  ],
}
