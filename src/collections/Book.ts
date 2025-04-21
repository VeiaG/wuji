import { slugField } from '@/fields/slug'
import type { CollectionConfig } from 'payload'

export const Books: CollectionConfig = {
  slug: 'books',
  admin: {
    useAsTitle: 'title',
  },
  orderable: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'genres',
      type: 'relationship',
      relationTo: 'bookGenres',
      hasMany: true,
      required: true,
    },

    {
      name: 'chapters',
      type: 'join',
      collection: 'bookChapters',
      on: 'book',
      //   orderable: true, //TODO this is not working good for now , update later (fix is merged , but not released yet)
      admin: {
        defaultColumns: ['title', 'addedAt'],
      },
    },
    {
      name: 'volumes',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          index: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'from',
              type: 'number',
              required: true,
            },
            {
              name: 'to',
              type: 'number',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: false,
      required: true,
      admin: {
        position: 'sidebar',
      },
    },

    ...slugField(),
  ],
}
