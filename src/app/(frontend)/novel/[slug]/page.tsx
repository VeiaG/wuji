import { notFound } from 'next/navigation'
import Image from 'next/image'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RichText from '@/components/RichText'
import { ExpandableDescription } from '@/components/expandable-description'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import ReadButton from '@/components/read-button'
import { queryBookBySlug } from '@/queries'
import Chapters from '@/components/chapters'
import BookmarkButton from '@/components/bookmark-button'
import { Metadata } from 'next'
import { generateMeta } from '@/lib/generateMeta'
import { getServerSideURL } from '@/lib/getURL'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const statusMap = {
  ongoing: 'Онгоінг',
  completed: 'Завершено',
  hiatus: 'На паузі',
  cancelled: 'Скасовано',
  fallback: 'N/A',
}

const NovelPage: React.FC<Args> = async ({ params }) => {
  const { slug = '' } = await params
  const book = await queryBookBySlug({ slug })
  if (!book) return notFound()

  return (
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
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const book = await queryBookBySlug({ slug })
  const metadata = await generateMeta({ doc: book })
  //remove images property entirely from metadata, and set them to our og image
  const ogImage = `${getServerSideURL()}/novel/${slug}/og`

  if (metadata.openGraph) {
    metadata.openGraph.images = [ogImage]
  } else {
    metadata.openGraph = {
      images: [ogImage],
    }
  }

  return metadata
}
export default NovelPage
