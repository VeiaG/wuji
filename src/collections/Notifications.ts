import type { CollectionConfig } from 'payload'
import adminsAndUserByField from './access/adminsAndUserByField'
import { checkRole } from './access/checkRole'
import { User } from '@/payload-types'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  labels: {
    singular: { en: 'Notification', uk: 'Сповіщення' },
    plural: { en: 'Notifications', uk: 'Сповіщення' },
  },
  access: {
    read: adminsAndUserByField('user'),
    create: ({ req: { user } }) => checkRole(['admin'], user as unknown as User),
    update: adminsAndUserByField('user'),
    delete: adminsAndUserByField('user'),
  },
  admin: {
    hidden({ user }) {
      return !user || !checkRole(['admin'], user as unknown as User)
    },
    defaultColumns: ['title', 'type', 'user', 'read', 'createdAt'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: { en: 'User', uk: 'Користувач' },
      index: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: { en: 'Title', uk: 'Заголовок' },
    },
    {
      name: 'message',
      type: 'textarea',
      label: { en: 'Message', uk: 'Повідомлення' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'info',
      label: { en: 'Type', uk: 'Тип' },
      options: [
        { label: { en: 'Info', uk: 'Інфо' }, value: 'info' },
        { label: { en: 'Warning', uk: 'Попередження' }, value: 'warning' },
        { label: { en: 'Error', uk: 'Помилка' }, value: 'error' },
      ],
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      label: { en: 'Read', uk: 'Прочитано' },
    },
    {
      name: 'link',
      type: 'text',
      label: { en: 'Link', uk: 'Посилання' },
    },
  ],
}
