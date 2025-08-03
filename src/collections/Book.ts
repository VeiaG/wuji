import { slugField } from '@/fields/slug'
import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { admins, adminsFieldAccess } from './access/admins'
import adminsAndEditorsBook, { baseListFilterBooks } from './access/books'
import { revalidateBook, revalidateDeleteBook } from './hooks/revalidateBookList'
export const Books: CollectionConfig = {
  slug: 'books',
  labels: {
    singular: {
      en: 'Book',
      uk: 'Книга',
    },
    plural: {
      en: 'Books',
      uk: 'Книги',
    },
  },
  admin: {
    useAsTitle: 'title',
    baseListFilter: baseListFilterBooks, // Filter books based on user access
    group: {
      en: 'Content',
      uk: 'Контент',
    },
  },
  orderable: true,
  defaultSort: '_order',
  access: {
    read: anyone,
    create: admins,
    update: adminsAndEditorsBook, //admins and editors can update books
    delete: admins,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: {
        en: 'Title',
        uk: 'Назва',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        position: 'sidebar',
      },
      access: {
        //restrict uploading to admins only
        update: adminsFieldAccess,
        create: adminsFieldAccess,
      },
      label: {
        en: 'Cover Image',
        uk: 'Обкладинка',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      label: {
        en: 'Description',
        uk: 'Опис',
      },
    },
    {
      name: 'genres',
      type: 'relationship',
      relationTo: 'bookGenres',
      hasMany: true,
      required: true,
      access: {
        //restrict updating to admins only
        update: adminsFieldAccess,
        create: adminsFieldAccess,
      },
      admin: {
        position: 'sidebar',
        allowCreate: false, // prevent creating new genres from book creation
      },
      label: {
        en: 'Genres',
        uk: 'Жанри',
      },
    },

    {
      name: 'chapters',
      type: 'join',
      collection: 'bookChapters',
      on: 'book',
      orderable: true,
      admin: {
        defaultColumns: ['title', 'addedAt'],
      },
      label: {
        en: 'Chapters',
        uk: 'Розділи',
      },
    },
    {
      name: 'volumes',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          index: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'from',
              type: 'number',
              required: true,
            },
            {
              name: 'to',
              type: 'number',
              required: true,
            },
          ],
        },
      ],
      label: {
        en: 'Volumes',
        uk: 'Томи',
      },
      admin: {
        description: {
          en: 'Volumes are used to group chapters. For example, a book can have multiple volumes, each containing a range of chapters.',
          uk: 'Томи використовуються для групування розділів. Наприклад, книга може мати кілька томів, кожен з яких містить діапазон розділів.',
        },
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: false,
      required: true,
      admin: {
        position: 'sidebar',
      },
      access: {
        //restrict updating to admins only
        update: adminsFieldAccess,
        create: adminsFieldAccess,
      },
      label: {
        en: 'Author',
        uk: 'Автор',
      },
    },

    ...slugField(),
    {
      name: 'chapterCount',
      type: 'number',
      label: {
        en: 'Chapter Count',
        uk: 'Кількість розділів',
      },
      admin: {
        position: 'sidebar',
        readOnly: true, // this field is calculated and should not be edited manually
      },
    },
  ],
  hooks: {
    afterChange: [revalidateBook],
    afterDelete: [revalidateDeleteBook],
  },
  // TODO : Add hooks for revalidating homepage/books page
}
