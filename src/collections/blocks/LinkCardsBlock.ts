import { Block } from 'payload'
import { linksField } from './fields'

const LinkCardsBlock: Block = {
  slug: 'link-cards',
  interfaceName: 'LinkCardsBlock',
  labels: {
    singular: {
      en: 'Link Cards',
      uk: 'Картки посилань',
    },
    plural: {
      en: 'Link Cards',
      uk: 'Картки посилань',
    },
  },
  fields: [
    {
      name: 'columns',
      type: 'select',
      defaultValue: '2',
      label: {
        en: 'Columns',
        uk: 'Колонки',
      },
      options: [
        { label: { en: 'One Column', uk: 'Одна колонка' }, value: '1' },
        { label: { en: 'Two Columns', uk: 'Дві колонки' }, value: '2' },
        { label: { en: 'Three Columns', uk: 'Три колонки' }, value: '3' },
      ],
    },
    {
      name: 'cards',
      type: 'array',
      required: true,
      minRows: 1,
      label: {
        en: 'Cards',
        uk: 'Картки',
      },
      labels: {
        singular: {
          en: 'Card',
          uk: 'Картка',
        },
        plural: {
          en: 'Cards',
          uk: 'Картки',
        },
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: {
            en: 'Image',
            uk: 'Зображення',
          },
          admin: {
            description: {
              en: 'Optional. Preview image at the top of the card (16:9 works best).',
              uk: "Необов'язково. Прев'ю зверху картки (найкраще виглядає 16:9).",
            },
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: {
            en: 'Title',
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
        linksField(),
      ],
    },
  ],
}

export default LinkCardsBlock
