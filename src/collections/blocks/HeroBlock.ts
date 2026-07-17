import { Block } from 'payload'
import { iconField, linksField } from './fields'

const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: {
      en: 'Hero',
      uk: 'Hero-секція',
    },
    plural: {
      en: 'Hero Sections',
      uk: 'Hero-секції',
    },
  },
  fields: [
    {
      type: 'row',
      fields: [
        iconField({
          admin: {
            description: {
              en: 'Icon displayed next to the heading.',
              uk: 'Іконка, що відображається поруч із заголовком.',
            },
          },
        }),
        {
          name: 'heading',
          type: 'text',
          required: true,
          label: {
            en: 'Heading',
            uk: 'Заголовок',
          },
        },
      ],
    },
    {
      name: 'subheading',
      type: 'textarea',
      label: {
        en: 'Subheading',
        uk: 'Підзаголовок',
      },
    },
    {
      name: 'badges',
      type: 'array',
      label: {
        en: 'Badges',
        uk: 'Бейджі',
      },
      labels: {
        singular: {
          en: 'Badge',
          uk: 'Бейдж',
        },
        plural: {
          en: 'Badges',
          uk: 'Бейджі',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            iconField(),
            {
              name: 'label',
              type: 'text',
              required: true,
              label: {
                en: 'Label',
                uk: 'Текст',
              },
            },
            {
              name: 'variant',
              type: 'select',
              defaultValue: 'secondary',
              label: {
                en: 'Style',
                uk: 'Стиль',
              },
              options: [
                { label: { en: 'Secondary', uk: 'Другорядний' }, value: 'secondary' },
                { label: { en: 'Outline', uk: 'Контурний' }, value: 'outline' },
                { label: { en: 'Default', uk: 'Основний' }, value: 'default' },
              ],
            },
          ],
        },
      ],
    },
    linksField(),
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: {
        en: 'Background Image (ambient gradient)',
        uk: 'Фонове зображення (ambient градієнт)',
      },
      admin: {
        description: {
          en: 'Optional. Blurred image used as an ambient background of the section.',
          uk: "Необов'язково. Розмите зображення для атмосферного фону секції.",
        },
      },
    },
  ],
}

export default HeroBlock
