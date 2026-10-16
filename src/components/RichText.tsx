import { cn } from '@/lib/utils'
import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'
import { memo } from 'react'
import { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { CodeBlock as CodeBlockFields, ComparisonBlock } from '@/payload-types'

import { Comparison, ComparisonHandle, ComparisonItem } from '@/components/ui/shadcn-io/comparison'
import Image from 'next/image'
import CodeBlock from '@/components/CodeBlock'
import FileAttachment from '@/components/FileAttachment'
import ZoomableImage from '@/components/ZoomableImage'
import Link from 'next/link'
import { getDocPath } from '@/lib/docPath'
type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<ComparisonBlock>
  | SerializedBlockNode<CodeBlockFields>

const createConverters =
  (zoomImages: boolean): JSXConvertersFunction<NodeTypes> =>
  ({ defaultConverters }) => ({
    ...defaultConverters,
    // Не-картинки (колекція files) — плитка з кнопкою завантаження; картинки — зі збільшенням на клік
    upload: (args) => {
      const { node } = args
      if (node.relationTo === 'files' && typeof node.value === 'object') {
        return <FileAttachment file={node.value} />
      }
      const renderDefault = defaultConverters.upload
      const rendered = typeof renderDefault === 'function' ? renderDefault(args) : null
      if (!zoomImages || !rendered || node.relationTo !== 'media' || typeof node.value !== 'object')
        return rendered
      const doc = node.value
      if (!doc.url || !doc.mimeType?.startsWith('image')) return rendered
      return (
        <ZoomableImage
          src={doc.url}
          alt={(node.fields?.alt as string | undefined) || doc.alt || ''}
          width={doc.width}
          height={doc.height}
        >
          {rendered}
        </ZoomableImage>
      )
    },
    // Внутрішні посилання зберігають зв'язок з документом — URL будуємо з актуального slug.
    // Якщо документ не вдалося підтягнути (видалено / недостатній depth), лишаємо просто текст
    link: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      const { linkType, doc, url, newTab } = node.fields
      const targetProps = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}

      if (linkType === 'internal') {
        const href = doc ? getDocPath(doc.relationTo, doc.value) : null
        if (!href) return <>{children}</>
        return (
          <Link href={href} {...targetProps}>
            {children}
          </Link>
        )
      }

      if (!url) return <>{children}</>
      return (
        <a href={url} {...targetProps}>
          {children}
        </a>
      )
    },
    blocks: {
      code: ({ node }) => <CodeBlock code={node.fields.code} language={node.fields.language} />,
      'comparison-block': ({ node }) => {
        const { leftImage, rightImage, title } = node.fields
        if (!leftImage || !rightImage) return null
        if (typeof leftImage === 'string' || typeof rightImage === 'string') return null

        return (
          <div className="mt-6 mb-4">
            <Comparison className="aspect-video w-full rounded-md overflow-hidden border border-border">
              <ComparisonItem position="left">
                <Image
                  height={leftImage.height || 1080}
                  width={leftImage.width || 1920}
                  src={leftImage.url || ''}
                  alt={leftImage.alt || 'Left Comparison Image'}
                  className="m-0! select-none"
                  draggable={false}
                />
              </ComparisonItem>
              <ComparisonItem position="right">
                <Image
                  height={rightImage.height || 1080}
                  width={rightImage.width || 1920}
                  src={rightImage.url || ''}
                  alt={rightImage.alt || 'Left Comparison Image'}
                  className="m-0! select-none"
                  draggable={false}
                />
              </ComparisonItem>
              <ComparisonHandle />
            </Comparison>
            {title && <p className="mt-2 text-center text-sm text-muted-foreground">{title}</p>}
          </div>
        )
      },
    },
  })

const jsxConverters = createConverters(false)
const zoomableConverters = createConverters(true)

type Props = {
  data: DefaultTypedEditorState
  /** Збільшення картинок на клік (поки лише в блозі) */
  zoomImages?: boolean
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = false, zoomImages = false, ...rest } = props
  return (
    <ConvertRichText
      converters={zoomImages ? zoomableConverters : jsxConverters}
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose prose-zinc dark:prose-invert': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}

const MemoizedRichText = memo(RichText)
export default MemoizedRichText
