import { RichTextBlock } from '@/payload-types'
import RichText from '@/components/RichText'
import { cn } from '@/lib/utils'
import { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

const RichTextBlockComponent: React.FC<RichTextBlock> = ({ content, width }) => {
  return (
    <section className="py-8">
      <div
        className={cn('container mx-auto px-4', {
          'max-w-[900px]': width !== 'default',
        })}
      >
        <RichText data={content as DefaultTypedEditorState} />
      </div>
    </section>
  )
}

export default RichTextBlockComponent
