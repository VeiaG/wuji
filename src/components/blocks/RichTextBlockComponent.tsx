import { RichTextBlock } from '@/payload-types'
import RichText from '@/components/RichText'
import { cn } from '@/lib/utils'
import { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

const RichTextBlockComponent: React.FC<RichTextBlock> = ({ content, width }) => {
  return (
    <section className="container-page py-6 md:py-8">
      <RichText
        data={content as DefaultTypedEditorState}
        className={cn(
          'prose-invert prose-headings:font-display prose-headings:tracking-tight prose-p:text-soft prose-li:text-soft prose-a:text-primary',
          width !== 'default' ? 'mx-auto max-w-[760px]' : 'max-w-none',
        )}
      />
    </section>
  )
}

export default RichTextBlockComponent
