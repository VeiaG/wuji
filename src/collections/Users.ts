import type { CollectionConfig } from 'payload'
import { protectRoles } from './hooks/protectRoles'
import adminsAndUser, { adminsAndUserFieldAccess } from './access/adminsAndUser'
import { anyone } from './access/anyone'
import { admins, adminsFieldAccess } from './access/admins'
import { checkRole } from './access/checkRole'
import { User } from '@/payload-types'
import { getResetPasswordEmailHTML, getVerificationEmailHTML } from './emails'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    hidden({ user }) {
      return !user || !checkRole(['admin'], user as unknown as User)
    },
  },
  labels: {
    plural: {
      en: 'Users',
      uk: 'Користувачі',
    },
    singular: {
      en: 'User',
      uk: 'Користувача',
    },
  },
  auth: {
    //todo : utilize refresh fuctionality , to auto regen token before expiration if user is active
    tokenExpiration: 2592000, // 30 days
    verify: {
      generateEmailHTML: async ({ token, user }) => {
        const url = `https://ranobes.veiag.dev/verify?token=${token}`
        const userName = user?.nickname || user?.email

        return await getVerificationEmailHTML(url, userName)
      },
    },
    forgotPassword: {
      generateEmailHTML: async (args) => {
        if (!args) {
          return getResetPasswordEmailHTML('', '')
        }
        const { token, user } = args
        const url = `https://ranobes.veiag.dev/reset-password?token=${token}`
        const userName = user?.nickname || user?.email

        return await getResetPasswordEmailHTML(url, userName)
      },
    },
  },
  access: {
    read: anyone,
    create: anyone,
    update: adminsAndUser,
    delete: admins,
    admin: ({ req: { user } }) => checkRole(['admin', 'editor'], user),
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
      label: {
        en: 'Nickname',
        uk: 'Нікнейм',
      },
    },
    {
      name: 'roles',
      type: 'select',
      saveToJWT: true,
      hasMany: true,
      label: {
        en: 'Roles',
        uk: 'Ролі',
      },
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Editor',
          value: 'editor',
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
      access: {
        update: adminsFieldAccess,
      },
    },
    {
      name: 'bookAccess',
      type: 'relationship',
      relationTo: 'books',
      hasMany: true,
      access: {
        read: adminsAndUserFieldAccess,
        update: adminsFieldAccess,
        create: adminsFieldAccess,
      },
      label: {
        en: 'Book Access',
        uk: 'Доступ до книг',
      },
      admin: {
        condition: (_, siblingData) => {
          if (siblingData?.roles?.includes('editor')) {
            return true
          }
          return false
        },
      },
    },
  ],
}
