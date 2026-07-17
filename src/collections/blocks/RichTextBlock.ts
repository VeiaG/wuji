import { Block } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import ComparisonBlock from './ComparisonBlock'

const RichTextBlock: Block = {
  slug: 'rich-text',
  interfaceName: 'RichTextBlock',
  labels: {
    singular: {
      en: 'Rich Text',
      uk: 'Текстовий блок',
    },
    plural: {
      en: 'Rich Text Blocks',
      uk: 'Текстові блоки',
    },
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: {
        en: 'Content',
        uk: 'Контент',
      },
      editor: lexicalEditor({
        features({ defaultFeatures, rootFeatures }) {
          return [
            ...defaultFeatures,
            ...rootFeatures,
            BlocksFeature({
              blocks: [ComparisonBlock],
            }),
          ]
        },
      }),
    },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'narrow',
      label: {
        en: 'Content Width',
        uk: 'Ширина контенту',
      },
      options: [
        { label: { en: 'Narrow (article)', uk: 'Вузька (стаття)' }, value: 'narrow' },
        { label: { en: 'Default', uk: 'Стандартна' }, value: 'default' },
      ],
    },
  ],
}

export default RichTextBlock
