'use client'
import Image from 'next/image'

import RichText from '@/components/RichText'
import { ExpandableDescription } from '@/components/expandable-description'
import Link from 'next/link'
import ReadButton from '@/components/read-button'
import Chapters from '@/components/chapters'
import BookmarkButton from '@/components/bookmark-button'
import DownloadBookButton from '@/components/download-book-button'
import Stars from '@/components/stars'
import Reviews from '@/components/reviews'
import { Book, BookGenre } from '@/payload-types'
import { SimpleTabs } from '@/components/ui/simple-tabs'
import { PenLine, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { sdk } from '@/lib/payloadSDK'
import { BookCard } from '@/components/BookCard'
import { CoverGrid, SectionHeader, StatTile, Tile } from '@/components/bento'
import { useBookReadProgress } from '@/hooks/useBookReadProgress'
import { extractID } from 'payload/shared'

const statusMap = {
  ongoing: 'Онгоінг',
  completed: 'Завершено',
  hiatus: 'На паузі',
  cancelled: 'Скасовано',
  fallback: 'N/A',
}

const pluralReviews = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'відгук'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'відгуки'
  return 'відгуків'
}

// Для оригіналів автором є користувач-власник, для перекладів — запис із колекції авторів
const BookAuthorLink = ({ book }: { book: Book }) => {
  if (book.origin === 'original') {
    if (typeof book.owner === 'object' && book.owner) {
      return (
        <Link
          href={`/profile/${book.owner.slug}`}
          className="font-semibold text-primary hover:opacity-90"
        >
          {book.owner.nickname}
        </Link>
      )
    }
    return <span className="font-semibold text-soft">Невідомий</span>
  }
  if (!book.author) {
    return <span className="font-semibold text-soft">Невідомий</span>
  }
  return (
    <Link
      href={`/author/${typeof book.author !== 'string' ? book.author.slug : ''}`}
      className="font-semibold text-primary hover:opacity-90"
    >
      {typeof book.author !== 'string' ? book.author.name : book.author}
    </Link>
  )
}

const RelatedBooks = ({ book }: { book: Book }) => {
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedBooks = async () => {
      try {
        const currentGenreIds =
          typeof book.genres === 'object'
            ? book.genres.map((g) => (typeof g === 'string' ? g : g.id))
            : []

        // Творець: для оригіналів — користувач-власник, для перекладів — автор
        const getCreatorId = (b: Pick<Book, 'origin' | 'owner' | 'author'>) => {
          const creator = b.origin === 'original' ? b.owner : b.author
          return creator ? String(extractID(creator)) : undefined
        }
        const currentCreatorId = getCreatorId(book)

        const books = await sdk.find({
          collection: 'books',
          limit: 12, // Трохи більше, щоб після фільтрації залишилось достатньо
          where: {
            id: { not_equals: book.id },
            genres: { in: currentGenreIds },
            // Не змішуємо оригінали та переклади в рекомендаціях
            origin:
              book.origin === 'original' ? { equals: 'original' } : { not_equals: 'original' },
          },
          select: {
            title: true,
            slug: true,
            coverImage: true,
            genres: true,
            author: true,
            origin: true,
            owner: true,
            averageRating: true,
          },
          populate: {
            authors: {
              name: true,
            },
            users: {
              nickname: true,
            },
          },
        })

        // Підраховуємо релевантність з вагами
        const scored =
          books?.docs?.map((b) => {
            const bookGenreIds =
              typeof b.genres === 'object'
                ? b.genres.map((g) => (typeof g === 'string' ? g : g.id))
                : []

            // Бонус лише коли обидва творці реально відомі — інакше
            // undefined === undefined давав би +15 усім кандидатам без автора
            const sameAuthor = !!currentCreatorId && getCreatorId(b) === currentCreatorId

            const commonGenres = bookGenreIds.filter((id) => currentGenreIds.includes(id))

            // Система балів:
            // - Кожен спільний жанр: +4 балів
            // - Той самий автор: +15 балів (пріоритет, але не завжди)
            // - Рейтинг: +1-5 балів
            const score = commonGenres.length * 4 + (sameAuthor ? 15 : 0) + (b.averageRating || 0)

            return {
              ...b,
              score,
              sameAuthor,
            }
          }) || []

        // Сортуємо по загальному score
        scored.sort((a, b) => b.score - a.score)
        setRelatedBooks(scored.slice(0, 6) as unknown as Book[])
      } catch (err) {
        console.error('Error fetching related books:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRelatedBooks()
  }, [book])

  if (!isLoading && relatedBooks.length === 0) return null

  return (
    <section className="mt-10 flex flex-col gap-[22px]">
      <SectionHeader title="Схожі книги" />
      <CoverGrid>
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-3">
                <div className="aspect-[2/3] w-full animate-pulse rounded-2xl bg-tile" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-tile" />
              </div>
            ))
          : relatedBooks.map((related) => <BookCard book={related} key={related.id} />)}
      </CoverGrid>
    </section>
  )
}

const ProgressStat = ({ book, slug }: { book: Book; slug: string }) => {
  const { chapter, user } = useBookReadProgress(book.slug || slug)
  const total = book.chapterCount || 0

  if (chapter === undefined) {
    return <StatTile label="Ваш прогрес" value="…" hint="завантаження" accent />
  }
  if (user === null) {
    return (
      <StatTile
        label="Ваш прогрес"
        value="—"
        hint={
          <Link href="/login" className="text-primary hover:opacity-90">
            увійдіть, щоб зберігати
          </Link>
        }
      />
    )
  }
  if (!chapter) return <StatTile label="Ваш прогрес" value="0%" hint="ще не почато" accent />

  const percent = total ? Math.min(100, Math.round((chapter / total) * 100)) : 0
  return (
    <StatTile
      label="Ваш прогрес"
      value={`${percent}%`}
      hint={`розділ ${chapter} з ${total}`}
      accent
    />
  )
}

const NovelPageClient = ({ book, slug }: { book: Book; slug: string }) => {
  const cover = typeof book.coverImage === 'object' ? book.coverImage : null
  const genres = (book.genres || []).filter(
    (genre): genre is BookGenre => typeof genre === 'object' && genre !== null,
  )
  const totalReviews = book.totalReviews || 0

  const tabs = [
    {
      id: 'chapters',
      label: 'Розділи',
      content: <Chapters book={book} />,
    },
    {
      id: 'reviews',
      label: `Відгуки${totalReviews > 0 ? ` · ${totalReviews}` : ''}`,
      content: <Reviews bookID={book.id} />,
    },
  ]

  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <section className="flex flex-col gap-3.5 md:flex-row md:items-start">
        {/* Обкладинка */}
        {cover?.url && (
          <div className="mx-auto w-[min(260px,68vw)] shrink-0 md:sticky md:top-4 md:mx-0 md:w-[280px] lg:w-[340px]">
            <Image
              src={cover.url}
              alt={cover.alt || book.title}
              width={cover.width || 340}
              height={cover.height || 510}
              sizes="(min-width: 1024px) 340px, (min-width: 768px) 280px, 68vw"
              className="aspect-[2/3] w-full rounded-tile object-cover"
              priority
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <Tile className="flex flex-col gap-4 p-6 md:p-9">
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/novels?genre=${genre.id}`}
                    className="rounded-[10px] bg-chip px-3 py-[7px] text-[13px] font-semibold text-soft transition-colors hover:text-foreground"
                  >
                    {genre.title}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="heading-display text-[clamp(30px,4.2vw,48px)]">{book.title}</h1>

            <div className="flex flex-col gap-2 text-[15px] text-muted-foreground md:text-base">
              <span>
                автор <BookAuthorLink book={book} />
              </span>
              {book.alternativeNames && book.alternativeNames.length > 0 && (
                <span className="line-clamp-2 text-sm">{book.alternativeNames.join(' · ')}</span>
              )}
            </div>

            {(book.origin === 'original' || book.isAIAssisted) && (
              <div className="flex flex-wrap gap-2">
                {book.origin === 'original' && (
                  <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary/15 px-3 py-[7px] text-[13px] font-semibold text-primary">
                    <PenLine className="size-3.5" />
                    Оригінал
                  </span>
                )}
                {book.isAIAssisted && (
                  <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-chip px-3 py-[7px] text-[13px] font-semibold text-soft">
                    <Sparkles className="size-3.5" />
                    Написано з допомогою ШІ
                  </span>
                )}
              </div>
            )}

            {book.description && (
              <div className="prose prose-invert max-w-[680px] text-[16px] prose-p:leading-relaxed prose-p:text-soft md:text-[17px]">
                <ExpandableDescription maxHeight={150}>
                  <RichText data={book.description} />
                </ExpandableDescription>
              </div>
            )}

            <span className="flex-1" />

            <div className="mt-2 flex flex-wrap gap-2.5">
              <ReadButton className="min-w-full sm:min-w-[220px]" bookSlug={book.slug || slug} />
              <DownloadBookButton
                className="h-[54px] flex-1 rounded-2xl px-6 text-base sm:flex-none"
                book={book}
              />
              <BookmarkButton bookID={book.id} className="size-[54px] rounded-2xl" />
            </div>
          </Tile>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            <StatTile
              label="Рейтинг"
              value={
                <span className="flex flex-wrap items-center gap-x-2.5">
                  {book.averageRating ? book.averageRating.toFixed(1) : '0.0'}
                  <Stars rating={book.averageRating || 0} maxRating={5} size={14} showNumber={false} />
                </span>
              }
              hint={totalReviews > 0 ? `${totalReviews} ${pluralReviews(totalReviews)}` : 'ще немає відгуків'}
            />
            <StatTile
              label="Розділів"
              value={book.chapterCount || 0}
              hint={statusMap[book.status] || statusMap.fallback}
            />
            <ProgressStat book={book} slug={slug} />
          </div>
        </div>
      </section>

      <Tile className="p-4 md:p-7">
        <SimpleTabs tabs={tabs} defaultTab="chapters" />
      </Tile>

      <RelatedBooks book={book} />
    </div>
  )
}

export default NovelPageClient
