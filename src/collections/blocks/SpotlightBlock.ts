import { Block } from 'payload'

// Велика плитка «Новинка тижня» у верхньому ряду головної (поле spotlight у HomePage global)
const SpotlightBlock: Block = {
  slug: 'spotlight',
  interfaceName: 'SpotlightBlock',
  labels: {
    singular: {
      en: 'Spotlight',
      uk: 'Новинка тижня',
    },
    plural: {
      en: 'Spotlights',
      uk: 'Новинки тижня',
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
          en: 'Small label above the book title. Defaults to "Новинка тижня".',
          uk: 'Малий надпис над назвою книги. За замовчуванням — "Новинка тижня".',
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

export default SpotlightBlock
