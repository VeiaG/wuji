import type React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RichText from '@/components/RichText'
import { ExpandableDescription } from '@/components/expandable-description'
import { queryAuthorBySlug } from '@/queries'
import { BookCard } from '@/components/BookCard'
import type { Book } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { CoverGrid, SectionHeader, StatTile, Tile } from '@/components/bento'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const AuthorPage: React.FC<Args> = async ({ params }) => {
  const { slug = '' } = await params
  const author = await queryAuthorBySlug({ slug })

  if (!author) return notFound()

  const books = (author.books?.docs || []).filter((book): book is Book => typeof book !== 'string')
  const bookCount = author.books?.totalDocs ?? books.length
  const bookWord =
    bookCount % 10 === 1 && bookCount % 100 !== 11
      ? 'книга'
      : bookCount % 10 >= 2 && bookCount % 10 <= 4 && (bookCount % 100 < 12 || bookCount % 100 > 14)
        ? 'книги'
        : 'книг'

  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      {/* Шапка автора */}
      <section className="flex flex-col gap-3.5 md:flex-row md:items-stretch">
        <Tile className="flex min-w-0 flex-1 flex-col gap-5 p-6 md:flex-row md:items-start md:gap-7 md:p-9">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-chip font-display text-[34px] font-extrabold text-foreground md:size-28 md:text-[48px]">
            {author.name.charAt(0).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-col gap-3">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              Автор
            </span>
            <h1 className="heading-display text-[clamp(30px,4.2vw,48px)]">{author.name}</h1>
            {author.description && (
              <div className="prose prose-invert max-w-[680px] text-[16px] prose-p:leading-relaxed prose-p:text-soft md:text-[17px]">
                <ExpandableDescription maxHeight={220}>
                  <RichText data={author.description} />
                </ExpandableDescription>
              </div>
            )}
          </div>
        </Tile>

        <div className="flex flex-col gap-3.5 md:w-[220px]">
          <StatTile label="Творів" value={bookCount} hint={`${bookWord} у бібліотеці`} accent />
        </div>
      </section>

      {/* Твори */}
      <section className="mt-10 flex flex-col gap-[22px]">
        <SectionHeader title="Твори автора" />
        {books.length > 0 ? (
          <CoverGrid>
            {books.map((book, index) => (
              <BookCard key={book.id || index} book={book} />
            ))}
          </CoverGrid>
        ) : (
          <Tile className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <h3 className="heading-display text-xl">Поки що немає опублікованих творів</h3>
            <p className="max-w-[440px] text-muted-foreground">
              У цього автора поки що немає опублікованих книг у нашій бібліотеці. Слідкуйте за
              оновленнями!
            </p>
            <Button asChild className="mt-2">
              <Link href="/novels">До каталогу</Link>
            </Button>
          </Tile>
        )}
      </section>
    </div>
  )
}

export default AuthorPage
