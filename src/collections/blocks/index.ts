import type { Block } from 'payload'

import RichTextBlock from './RichTextBlock'
import HeroBlock from './HeroBlock'
import FeaturedBookBlock from './FeaturedBookBlock'
import BookArchiveBlock from './BookArchiveBlock'
import CardGridBlock from './CardGridBlock'
import SeparatorBlock from './SeparatorBlock'

/**
 * Блоки, доступні для сторінок (Pages) та слотів головної сторінки (HomePage global).
 */
export const pageBlocks: Block[] = [
  HeroBlock,
  RichTextBlock,
  CardGridBlock,
  FeaturedBookBlock,
  BookArchiveBlock,
  SeparatorBlock,
]
