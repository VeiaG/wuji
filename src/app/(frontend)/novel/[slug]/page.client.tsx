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

const statusMap = {
  ongoing: 'Онгоінг',
  completed: 'Завершено',
  hiatus: 'На паузі',
  cancelled: 'Скасовано',
  fallback: 'N/A',
}

const NovelPageClient = ({ book, slug }: { book: Book; slug: string }) => {
  return (
    <>
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 py-4 md:py-8 relative">
        <div className="flex flex-col gap-2 relative">
          {typeof book.coverImage === 'object' && (
            <Image
              src={book.coverImage?.url || ''}
              alt={book.coverImage?.alt || ''}
              width={book.coverImage?.width || 300}
              height={book.coverImage?.height || 300}
              className="rounded-lg aspect-[1/1.5] object-cover w-full max-w-[350px] mx-auto"
            />
          )}
          <div>
            Автор:{' '}
            <Link
              href={`/author/${typeof book.author !== 'string' ? book.author.slug : ''}`}
              className="text-blue-500 hover:underline"
            >
              {typeof book.author !== 'string' ? book.author.name : book.author}
            </Link>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <span>Рейтинг:</span>
            <Stars
              rating={book.reviewsStats?.averageRating || 0}
              maxRating={5}
              size={20}
              showNumber={true}
            />
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
          <div className="flex gap-2 flex-wrap">
            {book.genres?.map((genre) => {
              if (typeof genre === 'string') return null
              return (
                <Badge key={genre.id} className="text-sm" variant="outline">
                  {genre.title}
                </Badge>
              )
            })}
          </div>
          <div className="flex gap-2 flex-wrap">
            {book.alternativeNames && book.alternativeNames?.length > 0 ? (
              <span>Інші назви:</span>
            ) : null}
            {book.alternativeNames?.map((name) => {
              return (
                <Badge key={name} className="text-sm" variant="secondary">
                  {name}
                </Badge>
              )
            })}
          </div>
          <div className="flex gap-2 flex-wrap">
            <span>Статус:</span>
            <Badge className="text-sm" variant="default">
              {statusMap[book.status] || statusMap.fallback}
            </Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span>Кількість розділів:</span>
            <Badge className="text-sm" variant="default">
              {book.chapterCount}
            </Badge>
          </div>
          <ReadButton className="w-full" bookSlug={book.slug || slug} />
          <DownloadBookButton className="w-full" book={book} />
        </div>
        <div className="flex flex-col gap-2 relative col-span-1 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-4xl">
                  <h1>{book.title}</h1>
                </CardTitle>
                <BookmarkButton bookID={book.id} />
              </div>
            </CardHeader>
            <CardContent>
              <ExpandableDescription>
                <RichText data={book.description} />
              </ExpandableDescription>
            </CardContent>
          </Card>
          <Chapters book={book} />
        </div>
      </div>
      <div className="container mx-auto py-8">
        <Reviews bookID={book.id} />
      </div>
    </>
  )
}

export default NovelPageClient
