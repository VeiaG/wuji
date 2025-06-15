import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { admins } from './access/admins'
import { checkRole } from './access/checkRole'
import { User } from '@/payload-types'

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
    hidden({ user }) {
      return !user || !checkRole(['admin'], user as unknown as User)
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
