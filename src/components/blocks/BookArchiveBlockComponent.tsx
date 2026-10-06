import { BookArchiveBlock } from '@/payload-types'
import { BookCard } from '@/components/BookCard'
import { CoverGrid, SectionHeader } from '@/components/bento'

const BookArchiveBlockComponent: React.FC<BookArchiveBlock> = ({
  heading,
  description,
  books,
  link,
}) => {
  const populatedBooks = books.filter((book) => typeof book === 'object')
  if (!populatedBooks.length) return null

  return (
    <section className="container-page flex flex-col gap-[22px] pt-4">
      <div className="flex flex-col gap-2">
        <SectionHeader
          title={heading}
          href={link?.enabled ? link.url || '/novels' : undefined}
          linkLabel={link?.label || 'Переглянути всі'}
        />
        {description && (
          <p className="max-w-[70ch] text-[15px] text-soft md:text-base">{description}</p>
        )}
      </div>
      <CoverGrid>
        {populatedBooks.map((book) => (
          <BookCard book={book} key={book.id} />
        ))}
      </CoverGrid>
    </section>
  )
}

export default BookArchiveBlockComponent
