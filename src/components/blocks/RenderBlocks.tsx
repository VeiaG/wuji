import React, { Fragment } from 'react'
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

export const RenderBlocks: React.FC<{ blocks?: PageBlock[] | null }> = ({ blocks }) => {
  if (!blocks?.length) return null

  return (
    <Fragment>
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
    </Fragment>
  )
}
