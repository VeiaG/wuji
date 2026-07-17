import { LinkCardsBlock } from '@/payload-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { BlockLinks } from './BlockLinks'

const LinkCardsBlockComponent: React.FC<LinkCardsBlock> = ({ columns, cards }) => {
  if (!cards?.length) return null

  return (
    <section className="py-8">
      <div className={cn('container mx-auto px-4', columns === '3' ? 'max-w-6xl' : 'max-w-4xl')}>
        <div
          className={cn('grid gap-6', {
            'md:grid-cols-2': columns === '2',
            'md:grid-cols-2 lg:grid-cols-3': columns === '3',
          })}
        >
          {cards.map((card) => {
            const image = typeof card.image === 'object' ? card.image : null

            return (
              <Card key={card.id || card.title} className="overflow-hidden pt-0 gap-4">
                {image?.url && (
                  <Image
                    src={image.url}
                    alt={image.alt || card.title}
                    width={image.width || 1280}
                    height={image.height || 720}
                    className="w-full aspect-video object-cover"
                  />
                )}
                <CardHeader className={cn(!image?.url && 'pt-6')}>
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {card.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  )}
                  <BlockLinks links={card.links} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default LinkCardsBlockComponent
