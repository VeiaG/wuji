import type { CollectionConfig } from 'payload'
import adminsAndUserByField from './access/adminsAndUserByField'
import { checkRole } from './access/checkRole'
import { User } from '@/payload-types'

export const Bookmarks: CollectionConfig = {
  slug: 'bookmarks',
  labels: {
    singular: {
      en: 'Bookmark',
      uk: 'Закладка',
    },
    plural: {
      en: 'Bookmarks',
      uk: 'Закладки',
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
