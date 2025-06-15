import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { admins } from './access/admins'
import {
  adminsAndEditorsChapters,
  baseListFilterChapters,
  bookSelectFilterOptions,
  chapterAccessValidation,
} from './access/books'

export const BookChapters: CollectionConfig = {
  slug: 'bookChapters',
  labels: {
    singular: {
      en: 'Book Chapter',
      uk: 'Розділ книги',
    },
    plural: {
      en: 'Book Chapters',
      uk: 'Розділи книг',
    },
  },
  admin: {
    useAsTitle: 'title',
    baseListFilter: baseListFilterChapters, // Filter chapters based on user access
    group: {
      en: 'Content',
      uk: 'Контент',
    },
  },
  access: {
    read: anyone,
    create: adminsAndEditorsChapters,
    update: adminsAndEditorsChapters,
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
    {
      name: 'isSpoiler',
      type: 'checkbox',
      defaultValue: false,
      label: {
        en: 'Is Spoiler',
        uk: 'Є спойлером',
      },
      admin: {
        description: {
          en: 'Check this if the title contains spoilers.',
          uk: 'Позначте, якщо назва містить спойлери.',
        },
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: {
        en: 'Content',
        uk: 'Зміст',
      },
    },
    {
      name: 'addedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      label: {
        en: 'Added At',
        uk: 'Додано',
      },
    },
    {
      name: 'book',
      type: 'relationship',
      relationTo: 'books',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
        allowCreate: false, // prevent creating new books from chapter creation
        allowEdit: false, // prevent editing book from chapter creation
      },
      filterOptions: bookSelectFilterOptions,
      validate: chapterAccessValidation, //aditional validation to check if user has access to the book. Used in API validation
      label: {
        en: 'Book',
        uk: 'Книга',
      },
    },
  ],
}
