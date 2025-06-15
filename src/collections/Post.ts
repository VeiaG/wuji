import { slugField } from '@/fields/slug'
import type { CollectionConfig } from 'payload'
import { revalidateDeletePost, revalidatePost } from './hooks/revalidatePost'
import { admins } from './access/admins'
import { checkRole } from './access/checkRole'
import { User } from '@/payload-types'

export const Post: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: {
      en: 'Post',
      uk: 'Пост',
    },
    plural: {
      en: 'Posts',
      uk: 'Пости',
    },
  },
  admin: {
    useAsTitle: 'title',
    group: {
      en: 'Blog',
      uk: 'Блог',
    },
    hidden({ user }) {
      return !user || !checkRole(['admin'], user as unknown as User)
    },
  },
  orderable: true,
  access: {
    read: ({ req }) => {
      if (req.user) {
        return true
      }
      return {
        or: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            _status: {
              exists: false,
            },
          },
        ],
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
      name: 'shortDescription',
      label: {
        en: 'Short Description',
        uk: 'Короткий опис',
      },
      type: 'textarea',
      required: true,
    },
    {
      name: 'image',
      label: {
        en: 'Image',
        uk: 'Зображення',
      },
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'content',
      label: {
        en: 'Content',
        uk: 'Контент',
      },
      type: 'richText',
      required: true,
    },
    {
      name: 'publishedAt',
      label: {
        en: 'Published At',
        uk: 'Опубліковано',
      },
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost],
    afterDelete: [revalidateDeletePost],
  },
  versions: {
    maxPerDoc: 5,
    drafts: true,
  },
}
