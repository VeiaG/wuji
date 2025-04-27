import type { CollectionConfig } from 'payload'
import { protectRoles } from './hooks/protectRoles'
import adminsAndUser, { adminsAndUserFieldAccess } from './access/adminsAndUser'
import { anyone } from './access/anyone'
import { admins } from './access/admins'
import { checkRole } from './access/checkRole'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    read: anyone,
    create: anyone,
    update: adminsAndUser,
    delete: admins,
    admin: ({ req: { user } }) => checkRole(['admin'], user),
  },

  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      access: {
        read: adminsAndUserFieldAccess,
      },
    },
    {
      name: 'nickname',
      type: 'text',
      required: true,
      // unique: true,
      maxLength: 20,
      minLength: 3,
    },
    {
      name: 'roles',
      type: 'select',
      saveToJWT: true,
      hasMany: true,
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'User',
          value: 'user',
        },
      ],
      defaultValue: ['user'],
      required: true,
      hooks: {
        beforeChange: [protectRoles],
      },
    },
  ],
}
