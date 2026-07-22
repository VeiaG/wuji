import { slugField } from '@/fields/slug'
import type { CollectionConfig } from 'payload'
import { admins } from './access/admins'
import { checkRole } from './access/checkRole'
import { hiddenUnlessRole } from './access/hidden'
import { pageBlocks } from './blocks'
import { revalidateDeletePage, revalidatePage } from './hooks/revalidatePage'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: {
      en: 'Page',
      uk: 'Сторінка',
    },
    plural: {
      en: 'Pages',
      uk: 'Сторінки',
    },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: {
      en: 'Pages',
      uk: 'Сторінки',
    },
    hidden: hiddenUnlessRole(['admin']),
  },
  access: {
    read: ({ req: { user } }) => {
      // Чернетки бачать лише адміни; всі інші — тільки опубліковані сторінки
      if (checkRole(['admin'], user)) {
        return true
      }
      return {
        _status: {
          equals: 'published',
        },
      }
    },
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [
    {
      name: 'title',
      label: {
        en: 'Title',
        uk: 'Назва',
      },
      type: 'text',
      required: true,
    },
    {
      name: 'layout',
      label: {
        en: 'Layout',
        uk: 'Контент сторінки',
      },
      type: 'blocks',
      required: true,
      blocks: pageBlocks,
    },
    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    afterDelete: [revalidateDeletePage],
  },
  versions: {
    maxPerDoc: 5,
    drafts: true,
  },
}
