import type { CollectionConfig } from 'payload'
import adminsAndUserByField from './access/adminsAndUserByField'
import { checkRole } from './access/checkRole'
import { User } from '@/payload-types'

export const ReadProgress: CollectionConfig = {
  slug: 'readProgress',
  labels: {
    singular: {
      en: 'Read Progress',
      uk: 'Прогрес читання',
    },
    plural: {
      en: 'Read Progresses',
      uk: 'Прогреси читання',
    },
  },
  access: {
    read: adminsAndUserByField('user'),
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
      name: 'book',
      type: 'relationship',
      relationTo: 'books',
      required: true,
      label: {
        en: 'Book',
        uk: 'Книга',
      },
    },
    {
      name: 'chapter',
      type: 'number',
      required: true,
      label: {
        en: 'Chapter',
        uk: 'Розділ',
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
