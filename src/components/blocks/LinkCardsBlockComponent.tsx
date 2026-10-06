import { LinkCardsBlock } from '@/payload-types'
import { Tile } from '@/components/bento'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { BlockLinks } from './BlockLinks'

const LinkCardsBlockComponent: React.FC<LinkCardsBlock> = ({ columns, cards }) => {
  if (!cards?.length) return null

  return (
    <section className="container-page">
      <div
        className={cn('grid gap-3.5', {
          'md:grid-cols-2': columns === '2',
          'md:grid-cols-2 lg:grid-cols-3': columns === '3',
        })}
      >
        {cards.map((card) => {
          const image = typeof card.image === 'object' ? card.image : null

          return (
            <Tile key={card.id || card.title} size="sm" className="flex flex-col overflow-hidden">
              {image?.url && (
                <Image
                  src={image.url}
                  alt={image.alt || card.title}
                  width={image.width || 1280}
                  height={image.height || 720}
                  className="aspect-video w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col gap-3 p-5 md:p-7">
                <h3 className="text-lg font-bold leading-tight md:text-xl">{card.title}</h3>
                {card.description && (
                  <p className="text-[15px] leading-relaxed text-soft">{card.description}</p>
                )}
                {card.links && card.links.length > 0 && (
                  <>
                    <span className="flex-1" />
                    <BlockLinks links={card.links} className="mt-1" />
                  </>
                )}
              </div>
            </Tile>
          )
        })}
      </div>
    </section>
  )
}

export default LinkCardsBlockComponent
