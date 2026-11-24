import type { CollectionConfig } from 'payload'
import {
  adminsAndEditorsChapters,
  adminsAndWritersDeleteChapters,
  baseListFilterChapters,
  bookSelectFilterOptions,
  chapterAccessValidation,
  readChapters,
} from './access/books'
import { bookRequestFilterOptions, chapterBookRequestValidation } from './access/bookRequests'
import { recountChaptersOnChange, recountChaptersOnDelete } from './hooks/recountChapters'

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
    read: readChapters, //only chapters of books; book request chapters — admins and the request owner
    create: adminsAndEditorsChapters,
    update: adminsAndEditorsChapters,
    delete: adminsAndWritersDeleteChapters, //admins can delete any chapter, writers — chapters of their own books
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
      //not required: a chapter belongs either to a book or to a book request
      //(exactly one — checked by bookRequest validation)
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
    {
      name: 'bookRequest',
      type: 'relationship',
      relationTo: 'bookRequests',
      hasMany: false,
      index: true,
      admin: {
        position: 'sidebar',
        allowCreate: false,
        allowEdit: false,
        description: {
          en: 'For a book that does not exist yet. Fill either Book or Book request.',
          uk: 'Для книги, якої ще немає. Заповніть або «Книга», або «Заявка на книгу».',
        },
      },
      filterOptions: bookRequestFilterOptions,
      validate: chapterBookRequestValidation,
      label: {
        en: 'Book request',
        uk: 'Заявка на книгу',
      },
    },
  ],
  hooks: {
    afterChange: [recountChaptersOnChange],
    afterDelete: [recountChaptersOnDelete],
  },
  versions: false,
  authorship: false,
}
