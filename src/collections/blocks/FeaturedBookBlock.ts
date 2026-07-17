import { Block } from 'payload'

const FeaturedBookBlock: Block = {
  slug: 'featured-book',
  interfaceName: 'FeaturedBookBlock',
  labels: {
    singular: {
      en: 'Featured Book',
      uk: 'Вибрана книга',
    },
    plural: {
      en: 'Featured Books',
      uk: 'Вибрані книги',
    },
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      label: {
        en: 'Label',
        uk: 'Надпис',
      },
      admin: {
        description: {
          en: 'Small label above the book title, e.g. "Editor\'s pick".',
          uk: 'Малий надпис над назвою книги, наприклад "Вибір редакції".',
        },
      },
    },
    {
      name: 'book',
      type: 'relationship',
      relationTo: 'books',
      required: true,
      label: {
        en: 'Book',
        uk: 'Книга',
      },
    },
    {
      name: 'customDescription',
      type: 'textarea',
      label: {
        en: 'Custom Description',
        uk: 'Власний опис',
      },
      admin: {
        description: {
          en: 'Optional. If empty, the book description will be used.',
          uk: "Необов'язково. Якщо порожньо — буде використано опис книги.",
        },
      },
    },
    {
      name: 'buttonLabel',
      type: 'text',
      label: {
        en: 'Button Label',
        uk: 'Текст кнопки',
      },
      admin: {
        description: {
          en: 'Defaults to "Читати".',
          uk: 'За замовчуванням — "Читати".',
        },
      },
    },
  ],
}

export default FeaturedBookBlock
