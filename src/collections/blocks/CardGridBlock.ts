import { Block } from 'payload'
import { iconColorField, iconField, linksField } from './fields'

const CardGridBlock: Block = {
  slug: 'card-grid',
  interfaceName: 'CardGridBlock',
  labels: {
    singular: {
      en: 'Card Grid',
      uk: 'Сітка карток',
    },
    plural: {
      en: 'Card Grids',
      uk: 'Сітки карток',
    },
  },
  fields: [
    {
      name: 'columns',
      type: 'select',
      defaultValue: '1',
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
          type: 'row',
          fields: [
            iconField(),
            iconColorField(),
            {
              name: 'title',
              type: 'text',
              required: true,
              label: {
                en: 'Title',
                uk: 'Заголовок',
              },
            },
          ],
        },
        {
          name: 'content',
          type: 'richText',
          label: {
            en: 'Content',
            uk: 'Контент',
          },
        },
        linksField(),
      ],
    },
  ],
}

export default CardGridBlock
