import { cn } from '@/lib/utils'
import { DefaultNodeTypes, type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'
import { memo } from 'react'

type NodeTypes = DefaultNodeTypes

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
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
