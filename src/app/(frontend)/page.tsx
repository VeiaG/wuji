import React from 'react'
import './styles.css'
import { BookCard } from '@/components/BookCard'
import BlogCard from '@/components/PostCard'
import { LatestComments } from '@/components/LatestComments'
import { Media } from '@/payload-types'
import config from '@/payload.config'
import { getPayload, type Payload } from 'payload'
import Link from 'next/link'
import Image from 'next/image'
import { formatTimeAgo } from '@/lib/formatTime'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { Chip, CoverGrid, SectionHeader, Tile } from '@/components/bento'
import { SpotlightTile } from '@/components/home/SpotlightTile'
import { ContinueTile } from '@/components/home/ContinueTile'
import { CommentQuoteTile } from '@/components/home/CommentQuoteTile'
import { cn } from '@/lib/utils'

export const revalidate = 86400 // Ревалідація раз на день

const TRENDING_LIMIT = 12
const TRENDING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

// Книги що набувають популярності: рахуємо читачів, які за останні 2 тижні
// просунулись далі 10-го розділу (updatedAt оновлюється лише при переході на новий розділ)
async function getTrendingBooks(payload: Payload) {
  const trendingSince = new Date(Date.now() - TRENDING_WINDOW_MS)
  const trendingAggregation: { _id: unknown; readers: number }[] = await payload.db.collections[
    'readProgress'
  ].aggregate([
    { $match: { chapter: { $gt: 10 }, updatedAt: { $gte: trendingSince } } },
    { $group: { _id: '$book', readers: { $sum: 1 }, lastRead: { $max: '$updatedAt' } } },
    { $sort: { readers: -1, lastRead: -1 } },
    { $limit: TRENDING_LIMIT * 3 }, // із запасом, бо частину відфільтрує origin
  ])
  const trendingIds = trendingAggregation.map((item) => String(item._id))

  const bookSelect = {
    title: true,
    slug: true,
    coverImage: true,
    genres: true,
  } as const

  const readTrendingData =
    trendingIds.length > 0
      ? await payload.find({
          collection: 'books',
          limit: trendingIds.length,
          pagination: false,
          where: {
            id: { in: trendingIds },
            origin: { not_equals: 'original' },
          },
          select: bookSelect,
        })
      : { docs: [] }

  // find не зберігає порядок — відновлюємо порядок з агрегації
  const readTrendingBooks = readTrendingData.docs
    .sort((a, b) => trendingIds.indexOf(a.id) - trendingIds.indexOf(b.id))
    .slice(0, TRENDING_LIMIT)

  // Якщо активних читачів мало — доповнюємо книгами з найвищим рейтингом
  const ratingFallbackData =
    readTrendingBooks.length < TRENDING_LIMIT
      ? await payload.find({
          collection: 'books',
          limit: TRENDING_LIMIT - readTrendingBooks.length,
          sort: '-averageRating',
          where: {
            id: { not_in: readTrendingBooks.map((book) => book.id) },
            origin: { not_equals: 'original' },
          },
          select: bookSelect,
        })
      : { docs: [] }

  return [...readTrendingBooks, ...ratingFallbackData.docs]
}

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Отримуємо останні книги
  const booksData = await payload.find({
    collection: 'books',
    limit: 12,
    sort: '-createdAt',
    where: {
      origin: {
        not_equals: 'original',
      },
    },
    select: {
      title: true,
      slug: true,
      coverImage: true,
      genres: true,
    },
  })

  const trendingBooks = await getTrendingBooks(payload)

  // Отримуємо останні блог пости
  const postsData = await payload.find({
    collection: 'posts',
    limit: 3,
    sort: '-publishedAt',
    where: {
      _status: {
        equals: 'published',
      },
    },
    select: {
      title: true,
      slug: true,
      shortDescription: true,
      image: true,
      publishedAt: true,
    },
  })

  // Отримуємо останні оновлені розділи
  const chaptersData = await payload.find({
    collection: 'bookChapters',
    limit: 8,
    sort: '-updatedAt',
    where: {
      'book.origin': {
        not_equals: 'original',
      },
    },
    select: {
      title: true,
      updatedAt: true,
      book: true,
    },
    populate: {
      books: {
        title: true,
        coverImage: true,
      },
    },
  })

  // Блоки з адмінки (глобал "Головна сторінка") — слоти над та під контентом
  const homePageGlobal = await payload.findGlobal({
    slug: 'home-page',
    depth: 2,
  })

  // Жанри для рядка чипів
  const genresData = await payload.find({
    collection: 'bookGenres',
    limit: 12,
    pagination: false,
    select: { title: true },
  })

  const books = booksData.docs
  const posts = postsData.docs
  const recentChapters = chaptersData.docs
  const spotlight = homePageGlobal?.spotlight?.[0]
  const hasSpotlight = !!spotlight && typeof spotlight.book === 'object'

  return (
    <>
      {/* Блоки над контентом */}
      <RenderBlocks blocks={homePageGlobal?.beforeContent} />

      <div className="container-page flex flex-col gap-3.5 pt-2">
        {/* Hero: новинка тижня + продовжити + цитата */}
        <section className="flex flex-col gap-3.5 lg:flex-row">
          {hasSpotlight && (
            <SpotlightTile block={spotlight} className="min-h-[260px] lg:min-h-[420px] lg:flex-[2_1_0%]" />
          )}
          <div
            className={cn(
              'grid grid-cols-1 gap-3.5 sm:grid-cols-2',
              hasSpotlight && 'lg:flex lg:flex-1 lg:flex-col',
            )}
          >
            <ContinueTile className={cn(hasSpotlight && 'lg:flex-1')} />
            <CommentQuoteTile />
          </div>
        </section>

        {/* Жанри */}
        {genresData.docs.length > 0 && (
          <nav
            aria-label="Жанри"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0"
          >
            <Link href="/novels" className="shrink-0">
              <Chip active>Усі</Chip>
            </Link>
            {genresData.docs.map((genre) => (
              <Link key={genre.id} href={`/novels?genre=${genre.id}`} className="shrink-0">
                <Chip>{genre.title}</Chip>
              </Link>
            ))}
          </nav>
        )}

        {/* Свіжі книги */}
        <section className="mt-6 flex flex-col gap-[22px]">
          <SectionHeader title="Свіжі книги" href="/novels" linkLabel="Усі ранобе" />
          <CoverGrid>
            {books.map((book) => (
              <BookCard book={book} key={book.id} />
            ))}
          </CoverGrid>
        </section>

        {/* Набувають популярності */}
        {trendingBooks.length > 0 && (
          <section className="mt-10 flex flex-col gap-[22px]">
            <SectionHeader title="Набувають популярності" />
            <CoverGrid>
              {trendingBooks.map((book) => (
                <BookCard book={book} key={book.id} />
              ))}
            </CoverGrid>
          </section>
        )}

        {/* Оновлені розділи + коментарі */}
        <section className="mt-10 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <Tile className="flex flex-col gap-5 p-5 md:p-7">
            <h2 className="heading-display text-[22px] md:text-2xl">Оновлені розділи</h2>
            <div className="flex flex-col gap-2">
              {recentChapters.map((chapter) => {
                if (typeof chapter.book !== 'object' || !chapter.book) return null
                const cover = typeof chapter.book.coverImage === 'object' ? chapter.book.coverImage : null

                return (
                  <Link
                    key={chapter.id}
                    href={`/redirect/novel/${chapter.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-chip p-2.5 pr-4 transition-colors hover:bg-chip/70"
                  >
                    {cover?.url && (
                      <Image
                        src={cover.url}
                        alt=""
                        width={40}
                        height={60}
                        className="h-[60px] w-10 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-semibold">{chapter.book.title}</span>
                      <span className="truncate text-[13px] text-muted-foreground">{chapter.title}</span>
                    </span>
                    <span className="shrink-0 text-[13px] text-muted-foreground">
                      {formatTimeAgo(chapter.updatedAt || new Date())}
                    </span>
                  </Link>
                )
              })}
            </div>
          </Tile>
          <Tile className="flex flex-col gap-5 p-5 md:p-7">
            <h2 className="heading-display text-[22px] md:text-2xl">Останні коментарі</h2>
            <LatestComments />
          </Tile>
        </section>

        {/* Блог */}
        {posts.length > 0 && (
          <section className="mt-10 flex flex-col gap-[22px]">
            <SectionHeader title="Блог" href="/blog" linkLabel="Усі пости" />
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard
                  key={post.id}
                  title={post.title}
                  description={post.shortDescription}
                  image={post.image as string | Media}
                  slug={post.slug || ''}
                  publishedAt={post.publishedAt}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Блоки під контентом */}
      <RenderBlocks blocks={homePageGlobal?.afterContent} />
    </>
  )
}
