import type { CollectionConfig } from 'payload'
import adminsAndUserByField from './access/adminsAndUserByField'
import { anyone } from './access/anyone'
import { checkRole } from './access/checkRole'
import { User } from '@/payload-types'
import { updateRatingAfterChange, updateRatingAfterDelete } from './hooks/updateRating'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: {
    singular: {
      en: 'Review',
      uk: 'Відгук',
    },
    plural: {
      en: 'Reviews',
      uk: 'Відгуки',
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
  indexes: [
    {
      fields: ['user', 'book'],
      unique: true,
    },
  ],
  admin: {
    hidden({ user }) {
      return !user || !checkRole(['admin'], user as unknown as User)
    },
    useAsTitle: 'content',
  },
  defaultSort: 'createdAt',
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
      name: 'content',
      type: 'textarea',
      required: true,
      maxLength: 1024,
      minLength: 1,
      label: {
        en: 'Content',
        uk: 'Зміст',
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      label: {
        en: 'Rating',
        uk: 'Рейтинг',
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
    afterChange: [updateRatingAfterChange],
    afterDelete: [updateRatingAfterDelete],
  },
}
