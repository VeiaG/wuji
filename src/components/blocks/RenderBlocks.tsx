import React from 'react'
import { cn } from '@/lib/utils'
import { Page } from '@/payload-types'

import HeroBlockComponent from './HeroBlockComponent'
import RichTextBlockComponent from './RichTextBlockComponent'
import CardGridBlockComponent from './CardGridBlockComponent'
import LinkCardsBlockComponent from './LinkCardsBlockComponent'
import FeaturedBookBlockComponent from './FeaturedBookBlockComponent'
import BookArchiveBlockComponent from './BookArchiveBlockComponent'
import SeparatorBlockComponent from './SeparatorBlockComponent'

type PageBlock = Page['layout'][number]

const blockComponents = {
  hero: HeroBlockComponent,
  'rich-text': RichTextBlockComponent,
  'card-grid': CardGridBlockComponent,
  'link-cards': LinkCardsBlockComponent,
  'featured-book': FeaturedBookBlockComponent,
  'book-archive': BookArchiveBlockComponent,
  separator: SeparatorBlockComponent,
}

// Відступи між блоками задаються тут, а не в самих блоках — щоб усі були однакові
export const RenderBlocks: React.FC<{ blocks?: PageBlock[] | null; className?: string }> = ({
  blocks,
  className,
}) => {
  if (!blocks?.length) return null

  return (
    <div className={cn('flex flex-col gap-3.5', className)}>
      {blocks.map((block, index) => {
        const { blockType } = block

        if (blockType && blockType in blockComponents) {
          const Block = blockComponents[blockType]

          if (Block) {
            // @ts-expect-error - block props are narrowed by blockType at runtime
            return <Block key={block.id || index} {...block} />
          }
        }
        return null
      })}
    </div>
  )
}
