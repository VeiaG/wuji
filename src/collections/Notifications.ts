import type { CollectionConfig } from 'payload'
import adminsAndUserByField from './access/adminsAndUserByField'
import { hiddenUnlessRole } from './access/hidden'
import { admins } from './access/admins'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  labels: {
    singular: { en: 'Notification', uk: 'Сповіщення' },
    plural: { en: 'Notifications', uk: 'Сповіщення' },
  },
  access: {
    read: adminsAndUserByField('user'),
    create:admins,
    update: adminsAndUserByField('user'),
    delete: adminsAndUserByField('user'),
  },
  admin: {
    hidden: hiddenUnlessRole(['admin']),
    defaultColumns: ['title', 'category', 'type', 'user', 'read', 'createdAt'],
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
      admin: {
        description: {
          en: 'Severity — drives the icon color.',
          uk: 'Важливість — визначає колір іконки.',
        },
      },
      options: [
        { label: { en: 'Info', uk: 'Інфо' }, value: 'info' },
        { label: { en: 'Warning', uk: 'Попередження' }, value: 'warning' },
        { label: { en: 'Error', uk: 'Помилка' }, value: 'error' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'system',
      index: true,
      label: { en: 'Category', uk: 'Категорія' },
      admin: {
        description: {
          en: 'Topic of the notification — used for filtering and the icon.',
          uk: 'Тема сповіщення — використовується для фільтрів і іконки.',
        },
      },
      options: [
        { label: { en: 'Comment', uk: 'Коментар' }, value: 'comment' },
        { label: { en: 'Reply', uk: 'Відповідь' }, value: 'reply' },
        { label: { en: 'System', uk: 'Системне' }, value: 'system' },
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
