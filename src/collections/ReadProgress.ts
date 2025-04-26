import type { CollectionConfig } from 'payload'
import adminsAndUserByField from './access/adminsAndUserByField'

export const ReadProgress: CollectionConfig = {
  slug: 'readProgress',
  access: {
    read: adminsAndUserByField('user'),
    create: ({ req: { user } }) => {
      return !!user
    },
    update: adminsAndUserByField('user'),
    delete: adminsAndUserByField('user'),
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'book',
      type: 'relationship',
      relationTo: 'books',
      required: true,
    },
    {
      name: 'chapter',
      type: 'number',
      required: true,
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
        return {
          ...data,
          user: userID,
        }
      },
    ],
  },
}
