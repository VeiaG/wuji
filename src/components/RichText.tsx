import { cn } from '@/lib/utils'
import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'
import { memo } from 'react'
import { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { ComparisonBlock } from '@/payload-types'

import { Comparison, ComparisonHandle, ComparisonItem } from '@/components/ui/shadcn-io/comparison'
import Image from 'next/image'
type NodeTypes = DefaultNodeTypes | SerializedBlockNode<ComparisonBlock>

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
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

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = false, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
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
