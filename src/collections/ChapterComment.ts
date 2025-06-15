import type { CollectionConfig } from 'payload'
import adminsAndUserByField from './access/adminsAndUserByField'
import { anyone } from './access/anyone'
import { checkRole } from './access/checkRole'
import { User } from '@/payload-types'

export const ChapterComment: CollectionConfig = {
  slug: 'chapterComments',
  labels: {
    singular: {
      en: 'Chapter Comment',
      uk: 'Коментар до розділу',
    },
    plural: {
      en: 'Chapter Comments',
      uk: 'Коментарі до розділів',
    },
  },
  access: {
    read: anyone,
    create: ({ req: { user } }) => {
      return !!user
    },
    update: adminsAndUserByField('user'),
    delete: adminsAndUserByField('user'),
  },
  admin: {
    hidden({ user }) {
      return !user || !checkRole(['admin'], user as unknown as User)
    },
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: {
        en: 'User',
        uk: 'Користувач',
      },
    },
    {
      name: 'chapter',
      type: 'relationship',
      relationTo: 'bookChapters',
      required: true,
      label: {
        en: 'Chapter',
        uk: 'Розділ',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      maxLength: 512,
      minLength: 1,
      label: {
        en: 'Content',
        uk: 'Зміст',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async function create({ req: { user }, data }) {
        if (!user) {
          return false
        }
        const userID = user.id
        //ensure user is not trying to change the user field , or change field of another user
        // but allow admins to change the user field
        if (data.user && !checkRole(['admin'], user as unknown as User)) {
          return data
        }
        return {
          ...data,
          user: userID,
        }
      },
    ],
  },
}
