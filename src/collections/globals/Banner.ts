import { GlobalConfig } from 'payload'
import { revalidateBanner } from '../hooks/revalidateBanner'

const Banner: GlobalConfig = {
  slug: 'banner',
  label: {
    en: 'Banner',
    uk: 'Банер',
  },
  fields: [
    {
      name: 'enabled',
      label: {
        en: 'Enabled',
        uk: 'Активний',
      },
      type: 'checkbox',
    },
    {
      name: 'settings',
      type: 'group',
      label: {
        en: 'Banner Settings',
        uk: 'Налаштування банера',
      },
      admin: {
        condition: (data, siblingData) => siblingData.enabled === true, // Показувати поле лише якщо банер активний
      },
      fields: [
        {
          name: 'uniqueID',
          label: {
            en: 'Unique ID',
            uk: 'Унікальний ID',
          },
          type: 'text',
          required: true,
          admin: {
            description: {
              uk: 'Унікальний ідентифікатор банеру. Використовується щоб зберігати налаштування показу банеру для користувача. Якщо ви зміните цей ID, всі користувачі побачать банер знову.',
              en: 'Unique identifier for the banner. Used to store user preferences for banner display. If you change this ID, all users will see the banner again.',
            },
          },
        },
        {
          name: 'text',
          label: {
            en: 'Banner Text',
            uk: 'Текст банера',
          },
          type: 'textarea',
          required: true,
          admin: {
            description: {
              uk: 'Текст, який буде відображатися в банері. Підтримується: **жирний** та *курсив*.',
              en: 'Text to be displayed in the banner. Supports: **bold** and *italic*.',
            },
          },
        },
        {
          name: 'isDismissible', // Буде круто додавати банери, які не можна закрити, для зборів на армію, коли буде більше користувачів
          label: {
            en: 'Is Dismissible',
            uk: 'Чи можна закрити',
          },
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'isLink',
          label: {
            en: 'Is Link',
            uk: 'Чи є посилання',
          },
          type: 'checkbox',
        },
        {
          name: 'linkSettings',
          type: 'group',
          label: {
            en: 'Link Settings',
            uk: 'Налаштування посилання',
          },
          admin: {
            condition: (data, siblingData) => siblingData.isLink === true,
          },
          fields: [
            {
              name: 'url',
              label: {
                en: 'URL',
                uk: 'URL',
              },
              type: 'text',
              required: true,
            },
            {
              name: 'buttonText',
              label: {
                en: 'Button Text',
                uk: 'Текст кнопки',
              },
              type: 'text',
              required: true,
            },
            {
              name: 'openInNewTab',
              label: {
                en: 'Open in New Tab',
                uk: 'Відкрити в новій вкладці',
              },
              type: 'checkbox',
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateBanner],
  },
}
export default Banner
