import { CardGridBlock } from '@/payload-types'
import RichText from '@/components/RichText'
import { Tile } from '@/components/bento'
import { cn } from '@/lib/utils'
import { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { BlockIcon } from './icons'
import { BlockLinks } from './BlockLinks'

const CardGridBlockComponent: React.FC<CardGridBlock> = ({ columns, cards }) => {
  if (!cards?.length) return null

  return (
    <section className="container-page">
      <div
        className={cn('grid gap-3.5', {
          'md:grid-cols-2': columns === '2',
          'md:grid-cols-2 lg:grid-cols-3': columns === '3',
        })}
      >
        {cards.map((card) => (
          <Tile key={card.id || card.title} size="sm" className="flex flex-col gap-4 p-5 md:p-7">
            <div className="flex items-center gap-3">
              {card.icon && (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-chip">
                  <BlockIcon icon={card.icon} color={card.iconColor || 'primary'} className="size-5" />
                </span>
              )}
              <h3 className="text-lg font-bold leading-tight md:text-xl">{card.title}</h3>
            </div>
            {card.content && (
              <RichText
                data={card.content as DefaultTypedEditorState}
                className="mx-0 leading-relaxed text-soft prose-p:text-soft prose-li:text-soft prose-a:text-primary"
              />
            )}
            {card.links && card.links.length > 0 && (
              <>
                <span className="flex-1" />
                <BlockLinks links={card.links} />
              </>
            )}
          </Tile>
        ))}
      </div>
    </section>
  )
}

export default CardGridBlockComponent
