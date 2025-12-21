import { Block } from 'payload'

const ComparisonBlock: Block = {
  slug: 'comparison-block',
  interfaceName: 'ComparisonBlock',
  labels: {
    singular: {
      en: 'Comparison Block',
      uk: 'Блок Порівняння',
    },
    plural: {
      en: 'Comparison Blocks',
      uk: 'Блоки Порівняння',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: false,
      label: {
        en: 'Title (optional)',
        uk: "Заголовок (необов'язково)",
      },
      admin: {
        description: {
          en: 'Block title displayed under the comparison slider.',
          uk: 'Заголовок блоку, який відображається під слайдером порівняння.',
        },
      },
    },
    {
      name: 'leftImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: {
        en: 'Left Image',
        uk: 'Ліве Зображення',
      },
      admin: {
        description: {
          en: 'The image that will be shown on the left side of the slider.',
          uk: 'Зображення, яке буде показано зліва від повзунка.',
        },
      },
    },
    {
      name: 'rightImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: {
        en: 'Right Image',
        uk: 'Праве Зображення',
      },
      admin: {
        description: {
          en: 'The image that will be shown on the right side of the slider.',
          uk: 'Зображення, яке буде показано праворуч від повзунка.',
        },
      },
    },
  ],
}

export default ComparisonBlock
