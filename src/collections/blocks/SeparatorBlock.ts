import { Block } from 'payload'

const SeparatorBlock: Block = {
  slug: 'separator',
  interfaceName: 'SeparatorBlock',
  labels: {
    singular: {
      en: 'Separator',
      uk: 'Розділювач',
    },
    plural: {
      en: 'Separators',
      uk: 'Розділювачі',
    },
  },
  fields: [
    {
      name: 'spacing',
      type: 'select',
      defaultValue: 'default',
      label: {
        en: 'Spacing',
        uk: 'Відступи',
      },
      options: [
        { label: { en: 'Small', uk: 'Малі' }, value: 'small' },
        { label: { en: 'Default', uk: 'Стандартні' }, value: 'default' },
        { label: { en: 'Large', uk: 'Великі' }, value: 'large' },
      ],
    },
  ],
}

export default SeparatorBlock
