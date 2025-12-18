import type { CollectionConfig } from 'payload'
import { protectRoles } from './hooks/protectRoles'
import adminsAndUser, { adminsAndUserFieldAccess } from './access/adminsAndUser'
import { anyone } from './access/anyone'
import { admins, adminsFieldAccess } from './access/admins'
import { checkRole } from './access/checkRole'
import { User } from '@/payload-types'
import { getResetPasswordEmailHTML, getVerificationEmailHTML } from './emails'
import { slugField } from '@/fields/slug'
import { googleStrategy } from '@/lib/auth/strategy'
import { googleAuth, googleCallback } from '@/lib/auth/endpoints'

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
    cookies: {
      domain: process.env.NODE_ENV === 'production' ? 'wuji.world' : 'localhost',
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    maxLoginAttempts: 5,
    strategies: [googleStrategy],

    //todo : utilize refresh fuctionality , to auto regen token before expiration if user is active
    tokenExpiration: 2592000, // 30 days
    verify: {
      generateEmailHTML: async ({ token, user }) => {
        const url = `https://wuji.world/verify?token=${token}`
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
        const url = `https://wuji.world/reset-password?token=${token}`
        const userName = user?.nickname || user?.email

        return await getResetPasswordEmailHTML(url, userName)
      },
    },
  },
  endpoints: [googleAuth, googleCallback],
  access: {
    read: anyone,
    create: anyone,
    update: adminsAndUser,
    delete: admins,
    admin: ({ req: { user } }) => checkRole(['admin', 'editor'], user),
  },

  fields: [
    {
      label: 'Strategies',
      name: 'authStrategies',
      type: 'array',
      fields: [
        {
          admin: {
            // hidden: true,
            readOnly: true,
          },
          name: 'providerUserId',
          type: 'text',
          access: {
            read: adminsFieldAccess,
            update: adminsFieldAccess,
            create: adminsFieldAccess,
          },
        },
        {
          admin: {
            // hidden: true,
            readOnly: true,
          },
          name: 'accessToken',
          type: 'text',
          access: {
            read: adminsFieldAccess,
            update: adminsFieldAccess,
            create: adminsFieldAccess,
          },
        },
        {
          admin: {
            // hidden: true,
            readOnly: true,
          },
          name: 'refreshToken',
          type: 'text',
          access: {
            read: adminsFieldAccess,
            update: adminsFieldAccess,
            create: adminsFieldAccess,
          },
        },
        {
          admin: {
            // hidden: true,
            readOnly: true,
          },
          name: 'tokenType',
          type: 'text',
          access: {
            read: adminsFieldAccess,
            update: adminsFieldAccess,
            create: adminsFieldAccess,
          },
        },
        {
          admin: {
            // hidden: true,
            readOnly: true,
          },
          name: 'idToken',
          type: 'text',
          access: {
            read: adminsFieldAccess,
            update: adminsFieldAccess,
            create: adminsFieldAccess,
          },
        },
        {
          admin: {
            // hidden: true,
            readOnly: true,
          },
          name: 'tokenExpiry',
          type: 'date',
          access: {
            read: adminsFieldAccess,
            update: adminsFieldAccess,
            create: adminsFieldAccess,
          },
        },
        {
          admin: {
            // hidden: true,
            readOnly: true,
          },
          name: 'authProvider',
          options: [
            {
              label: 'Google',
              value: 'google',
            },
          ],
          type: 'select',
          access: {
            read: adminsFieldAccess,
            update: adminsFieldAccess,
            create: adminsFieldAccess,
          },
        },
      ],
    },
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
      unique: true,
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
        {
          label: 'Supporter',
          value: 'supporter',
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
    // { //TODO: Enable avatars later, but create separate collection for user uploaded images ( with separate acessses, relation to user, maybe even moderation etc.)
    //   name: 'avatar',
    //   type: 'upload',
    //   relationTo: 'media',
    //   hasMany: true,
    //   access: {
    //     read: () => true,
    //     update: adminsFieldAccess,
    //     create: adminsFieldAccess,
    //   },
    //   label: {
    //     en: 'Avatar',
    //     uk: 'Аватар',
    //   },
    // },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true,
      label: {
        en: 'Is Public',
        uk: 'Публічний',
      },
    },
    ...slugField('nickname', {
      slugOverrides: {
        unique: true,
      },
    }),
  ],
}
