import { CodeBlock as PayloadCodeBlock } from '@payloadcms/richtext-lexical'
import { codeLanguages } from '@/lib/code-languages'

// Готовий блок коду з Payload (Monaco-редактор в адмінці); рендер на сайті — src/components/CodeBlock.tsx
const CodeBlock = PayloadCodeBlock({
  slug: 'code',
  defaultLanguage: 'typescript',
  languages: codeLanguages,
  fieldOverrides: {
    interfaceName: 'CodeBlock',
    labels: {
      singular: {
        en: 'Code',
        uk: 'Код',
      },
      plural: {
        en: 'Code Blocks',
        uk: 'Блоки коду',
      },
    },
  },
})

export default CodeBlock
