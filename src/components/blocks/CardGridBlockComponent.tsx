import { CardGridBlock } from '@/payload-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RichText from '@/components/RichText'
import { cn } from '@/lib/utils'
import { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { BlockIcon } from './icons'
import { BlockLinks } from './BlockLinks'

const CardGridBlockComponent: React.FC<CardGridBlock> = ({ columns, cards }) => {
  if (!cards?.length) return null

  return (
    <section className="py-8">
      <div
        className={cn('container mx-auto px-4', columns === '3' ? 'max-w-6xl' : 'max-w-4xl')}
      >
        <div
          className={cn('grid gap-6', {
            'md:grid-cols-2': columns === '2',
            'md:grid-cols-2 lg:grid-cols-3': columns === '3',
          })}
        >
          {cards.map((card) => (
            <Card key={card.id || card.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BlockIcon icon={card.icon} color={card.iconColor} className="h-5 w-5" />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {card.content && (
                  <RichText
                    data={card.content as DefaultTypedEditorState}
                    className="text-muted-foreground leading-relaxed"
                  />
                )}
                <BlockLinks links={card.links} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CardGridBlockComponent
