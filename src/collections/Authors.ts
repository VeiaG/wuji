import type { CollectionConfig } from 'payload'
import { anyone } from './access/anyone'
import { admins } from './access/admins'
import { hiddenUnlessRole } from './access/hidden'
import { slugField } from '@/fields/slug'
import { revalidateAuthor, revalidateDeleteAuthor } from './hooks/revalidateAuthor'
export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: {
    singular: {
      en: 'Author',
      uk: 'Автор',
    },
    plural: {
      en: 'Authors',
      uk: 'Автори',
    },
  },
  admin: {
    useAsTitle: 'name',
    // read-only для не-адмінів; лишаємо видимою для редакторів (довідник авторів),
    // ховаємо від письменників
    hidden: hiddenUnlessRole(['admin', 'editor']),
  },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      label: {
        en: 'Name',
        uk: "Ім'я",
      },
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'books',
      type: 'join',
      collection: 'books',
      on: 'author',
      defaultLimit: 0,
      maxDepth: 2,
      orderable: true, // Allow manual ordering
    },
    ...slugField('name'),
  ],
  hooks: {
    afterChange: [revalidateAuthor],
    afterDelete: [revalidateDeleteAuthor],
  },
}
