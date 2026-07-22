import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { admins } from './access/admins'
import { hiddenUnlessRole } from './access/hidden'

export const BookGenres: CollectionConfig = {
  slug: 'bookGenres',
  labels: {
    singular: {
      en: 'Book Genre',
      uk: 'Жанр книги',
    },
    plural: {
      en: 'Book Genres',
      uk: 'Жанри книг',
    },
  },
  admin: {
    useAsTitle: 'title',
    hidden: hiddenUnlessRole(['admin']),
  },
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
      label: {
        en: 'Title',
        uk: 'Назва',
      },
    },
  ],
}
