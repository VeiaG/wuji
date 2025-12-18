'use client'
import Image from 'next/image'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RichText from '@/components/RichText'
import { ExpandableDescription } from '@/components/expandable-description'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import ReadButton from '@/components/read-button'
import Chapters from '@/components/chapters'
import BookmarkButton from '@/components/bookmark-button'
import DownloadBookButton from '@/components/download-book-button'
import Stars from '@/components/stars'
import Reviews from '@/components/reviews'
import { Book } from '@/payload-types'
import { SimpleTabs } from '@/components/ui/simple-tabs'
import { useEffect, useState } from 'react'
import { sdk } from '@/lib/payloadSDK'
import { BookCard } from '@/components/BookCard'
import { extractID } from 'payload/shared'

const statusMap = {
  ongoing: 'Онгоінг',
  completed: 'Завершено',
  hiatus: 'На паузі',
  cancelled: 'Скасовано',
  fallback: 'N/A',
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

        const authorId = typeof book.author === 'string' ? book.author : book.author?.id

        const books = await sdk.find({
          collection: 'books',
          limit: 12, // Трохи більше, щоб після фільтрації залишилось достатньо
          where: {
            id: { not_equals: book.id },
            genres: { in: currentGenreIds },
          },
          select: {
            title: true,
            slug: true,
            coverImage: true,
            genres: true,
            author: true,
            averageRating: true,
          },
          populate: {
            authors: {
              name: true,
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

            const bookAuthorId = extractID(b.author)

            const commonGenres = bookGenreIds.filter((id) => currentGenreIds.includes(id))

            // Система балів:
            // - Кожен спільний жанр: +4 балів
            // - Той самий автор: +15 балів (пріоритет, але не завжди)
            // - Рейтинг: +1-5 балів
            const score =
              commonGenres.length * 4 +
              (bookAuthorId === authorId ? 15 : 0) +
              (b.averageRating || 0)

            return {
              ...b,
              score,
              sameAuthor: bookAuthorId === authorId,
            }
          }) || []

        // Сортуємо по загальному score
        scored.sort((a, b) => b.score - a.score)
        console.log('Related books scored:', scored)
        setRelatedBooks(scored.slice(0, 4) as unknown as Book[])
      } catch (err) {
        console.error('Error fetching related books:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRelatedBooks()
  }, [])

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Схожі книги</h2>
      {!isLoading && relatedBooks.length === 0 && <p>Схожі книги не знайдені.</p>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 xl:w-2/3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <div className="animate-pulse bg-muted rounded-lg aspect-[2/3] w-full"></div>
                <div className="h-4 bg-muted rounded mt-2 w-3/4 animate-pulse"></div>
              </div>
            ))
          : null}

        {relatedBooks.map((book) => {
          if (typeof book === 'string') return null
          return <BookCard book={book} key={book.id} />
        })}
      </div>
    </div>
  )
}

const NovelPageClient = ({ book, slug }: { book: Book; slug: string }) => {
  const tabs = [
    {
      id: 'about',
      label: 'Про книгу',
      content: (
        <div className="space-y-6">
          {/* Genres */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Жанри</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {book.genres?.map((genre) => {
                  if (typeof genre === 'string') return null
                  return (
                    <Badge key={genre.id} className="text-sm px-3 py-1" variant="outline">
                      {genre.title}
                    </Badge>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Alternative Names */}
          {book.alternativeNames && book.alternativeNames?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Альтернативні назви</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {book.alternativeNames?.map((name) => {
                    return (
                      <Badge key={name} className="text-sm px-3 py-1" variant="secondary">
                        {name}
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Book Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Детальна інформація</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Автор</span>
                  <Link
                    href={`/author/${typeof book.author !== 'string' ? book.author.slug : ''}`}
                    className="text-base text-blue-500 hover:underline font-medium"
                  >
                    {typeof book.author !== 'string' ? book.author.name : book.author}
                  </Link>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Статус</span>
                  <Badge className="text-sm w-fit px-3 py-1" variant="default">
                    {statusMap[book.status] || statusMap.fallback}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Кількість розділів</span>
                  <span className="text-base font-semibold">{book.chapterCount}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Рейтинг</span>
                  <div className="flex items-center gap-2">
                    <Stars
                      rating={book.averageRating || 0}
                      maxRating={5}
                      size={18}
                      showNumber={true}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'chapters',
      label: 'Розділи',
      content: <Chapters book={book} />,
    },
    {
      id: 'reviews',
      label: 'Відгуки',
      content: <Reviews bookID={book.id} />,
    },
  ]

  return (
    <div className="container mx-auto py-4 md:py-8">
      {typeof book.coverImage === 'object' && (
        <Image
          src={book.coverImage?.url || ''}
          alt={book.coverImage?.alt || ''}
          width={book.coverImage?.width || 300}
          height={book.coverImage?.height || 450}
          className="fixed  w-screen h-screen object-cover -z-10 opacity-5 blur-xl pointer-events-none"
          priority
        />
      )}
      {/* Top Section - Cover and Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 mb-8 items-start">
        {/* Left - Cover Image */}
        <div className="flex justify-center md:justify-start md:sticky md:top-4">
          {typeof book.coverImage === 'object' && (
            <Image
              src={book.coverImage?.url || ''}
              alt={book.coverImage?.alt || ''}
              width={book.coverImage?.width || 300}
              height={book.coverImage?.height || 450}
              className="rounded-lg aspect-[2/3] object-cover w-full max-w-[300px]"
              priority
            />
          )}
        </div>

        {/* Right - Title, Rating, Description, Buttons */}
        <div className="space-y-4">
          {/* Title and Bookmark */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{book.title}</h1>
            <BookmarkButton bookID={book.id} />
          </div>

          {/* Rating */}
          <div className="flex gap-3 items-center">
            <Stars rating={book.averageRating || 0} maxRating={5} size={24} showNumber={false} />
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {book.averageRating ? book.averageRating.toFixed(1) : '0.0'}
                /5
              </span>
              <span className="text-sm text-muted-foreground">
                ({book.totalReviews || 0}{' '}
                {(book.totalReviews || 0) === 0
                  ? 'відгуків'
                  : (book.totalReviews || 0) === 1
                    ? 'відгук'
                    : (book.totalReviews || 0) < 5
                      ? 'відгуки'
                      : 'відгуків'}
                )
              </span>
            </div>
          </div>

          {/* Author */}
          <div className="text-sm">
            <span className="text-muted-foreground">Автор: </span>
            <Link
              href={`/author/${typeof book.author !== 'string' ? book.author.slug : ''}`}
              className="text-blue-500 hover:underline font-medium"
            >
              {typeof book.author !== 'string' ? book.author.name : book.author}
            </Link>
          </div>

          {/* Description */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ExpandableDescription>
              <RichText data={book.description} />
            </ExpandableDescription>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 flex-wrap">
            <ReadButton className="min-w-[200px]" bookSlug={book.slug || slug} />
            <DownloadBookButton className="min-w-[200px]" book={book} />
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <SimpleTabs tabs={tabs} defaultTab="about" />
      <RelatedBooks book={book} />
    </div>
  )
}

export default NovelPageClient
