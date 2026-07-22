import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { admins, adminsFieldAccess } from './access/admins'
import { adminsAndWriters } from './access/books'
import { enforceMediaAuthorLimit } from './hooks/enforceMediaAuthorLimit'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: {
      en: 'Media',
      uk: 'Медіа',
    },
    plural: {
      en: 'Media',
      uk: 'Медіа',
    },
  },
  access: {
    read: anyone,
    create: adminsAndWriters, //writers upload covers for their own books
    update: admins,
    delete: admins,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      // required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      maxDepth: 1,
      label: {
        en: 'Author',
        uk: 'Автор',
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: {
          en: 'User who uploaded this file. Recorded automatically for non-admins (editor/writer).',
          uk: 'Користувач, який завантажив файл. Проставляється автоматично для не-адмінів (editor/writer).',
        },
      },
      access: {
        //значення форсується сервером у хуку enforceMediaAuthorLimit —
        //з форми змінити авторство не можна (лише адмін)
        create: adminsFieldAccess,
        update: adminsFieldAccess,
      },
    },
  ],
  hooks: {
    beforeValidate: [enforceMediaAuthorLimit],
  },
  upload: true,
}
