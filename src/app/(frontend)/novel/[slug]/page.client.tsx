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

const statusMap = {
  ongoing: 'Онгоінг',
  completed: 'Завершено',
  hiatus: 'На паузі',
  cancelled: 'Скасовано',
  fallback: 'N/A',
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
                      rating={book.reviewsStats?.averageRating || 0}
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
            <Stars
              rating={book.reviewsStats?.averageRating || 0}
              maxRating={5}
              size={24}
              showNumber={false}
            />
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {book.reviewsStats?.averageRating
                  ? book.reviewsStats.averageRating.toFixed(1)
                  : '0.0'}
                /5
              </span>
              <span className="text-sm text-muted-foreground">
                ({book.reviewsStats?.totalReviews || 0}{' '}
                {(book.reviewsStats?.totalReviews || 0) === 0
                  ? 'відгуків'
                  : (book.reviewsStats?.totalReviews || 0) === 1
                    ? 'відгук'
                    : (book.reviewsStats?.totalReviews || 0) < 5
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
    </div>
  )
}

export default NovelPageClient
