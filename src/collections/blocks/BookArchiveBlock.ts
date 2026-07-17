import { Block } from 'payload'

const BookArchiveBlock: Block = {
  slug: 'book-archive',
  interfaceName: 'BookArchiveBlock',
  labels: {
    singular: {
      en: 'Book Archive',
      uk: 'Список книг',
    },
    plural: {
      en: 'Book Archives',
      uk: 'Списки книг',
    },
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      label: {
        en: 'Heading',
        uk: 'Заголовок',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: {
        en: 'Description',
        uk: 'Опис',
      },
    },
    {
      name: 'books',
      type: 'relationship',
      relationTo: 'books',
      hasMany: true,
      required: true,
      minRows: 1,
      label: {
        en: 'Books',
        uk: 'Книги',
      },
      admin: {
        description: {
          en: 'Books are displayed in the selected order.',
          uk: 'Книги відображаються у вибраному порядку.',
        },
      },
    },
    {
      name: 'link',
      type: 'group',
      label: {
        en: '"View All" Link',
        uk: 'Посилання "Переглянути всі"',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: {
            en: 'Show Link',
            uk: 'Показати посилання',
          },
        },
        {
          type: 'row',
          admin: {
            condition: (data, siblingData) => siblingData.enabled === true,
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              label: {
                en: 'Label',
                uk: 'Текст',
              },
              admin: {
                description: {
                  en: 'Defaults to "Переглянути всі".',
                  uk: 'За замовчуванням — "Переглянути всі".',
                },
              },
            },
            {
              name: 'url',
              type: 'text',
              label: {
                en: 'URL',
                uk: 'URL',
              },
              admin: {
                description: {
                  en: 'Defaults to /novels.',
                  uk: 'За замовчуванням — /novels.',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}

export default BookArchiveBlock
