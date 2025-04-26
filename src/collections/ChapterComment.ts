import type { CollectionConfig } from 'payload'
import adminsAndUserByField from './access/adminsAndUserByField'
import { anyone } from './access/anyone'

export const ChapterComment: CollectionConfig = {
  slug: 'chapterComments',
  access: {
    read: anyone,
    create: ({ req: { user } }) => {
      return !!user
    },
    update: adminsAndUserByField('user'),
    delete: adminsAndUserByField('user'),
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'chapter',
      type: 'relationship',
      relationTo: 'bookChapters',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      maxLength: 512,
      minLength: 1,
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
