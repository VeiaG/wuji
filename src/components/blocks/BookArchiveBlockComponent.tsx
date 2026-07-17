import { BookArchiveBlock } from '@/payload-types'
import { BookCard } from '@/components/BookCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BlockBackground from './BlockBackground'

const BookArchiveBlockComponent: React.FC<BookArchiveBlock> = ({
  heading,
  description,
  books,
  link,
}) => {
  const populatedBooks = books.filter((book) => typeof book === 'object')
  if (!populatedBooks.length) return null

  const firstCover = populatedBooks[0].coverImage

  return (
    <section className="relative overflow-hidden py-8 border-b border-border/20">
      <BlockBackground image={firstCover} />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{heading}</h2>
            {description && <p className="text-muted-foreground mt-2">{description}</p>}
          </div>
          {link?.enabled && (
            <Button asChild variant="outline">
              <Link href={link.url || '/novels'} className="flex items-center gap-2">
                {link.label || 'Переглянути всі'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {populatedBooks.map((book) => (
            <BookCard book={book} key={book.id} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default BookArchiveBlockComponent
