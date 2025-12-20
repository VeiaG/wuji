import React from 'react'
import './styles.css'
import { BookCard } from '@/components/BookCard'
import BlogCard from '@/components/PostCard'
import { Button } from '@/components/ui/button'
import { LatestComments } from '@/components/LatestComments'
import { Media } from '@/payload-types'
import config from '@/payload.config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { formatTimeAgo } from '@/lib/formatTime'

export const revalidate = 86400 // Ревалідація раз на день

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Отримуємо останні книги
  const booksData = await payload.find({
    collection: 'books',
    limit: 8,
    sort: '-createdAt',
    select: {
      title: true,
      slug: true,
      coverImage: true,
      genres: true,
    },
  })

  // Отримуємо книги що набувають популярності (мінімум 2 відгуки)
  const trendingBooksData = await payload.find({
    collection: 'books',
    limit: 8,
    sort: '-averageRating',
    where: {
      totalReviews: {
        greater_than_equal: 0,
      },
    },
    select: {
      title: true,
      slug: true,
      coverImage: true,
      genres: true,
    },
  })

  // Отримуємо останні блог пости
  const postsData = await payload.find({
    collection: 'posts',
    limit: 6,
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
    limit: 20,
    sort: '-updatedAt',
    select: {
      title: true,
      updatedAt: true,
      book: true,
    },
    populate: {
      book: {
        title: true,
        slug: true,
        coverImage: true,
      },
    },
  })

  const books = booksData.docs
  const trendingBooks = trendingBooksData.docs
  const posts = postsData.docs
  const recentChapters = chaptersData.docs

  return (
    <div className="space-y-0">
      {/* Останні книги + Коментарі */}
      <section className="relative overflow-hidden py-8 border-b border-border/20">
        {/* Background gradient from first book cover */}
        {books[0] && typeof books[0].coverImage === 'object' && (
          <>
            <Image
              src={books[0].coverImage?.url || ''}
              alt=""
              width={books[0].coverImage?.width || 300}
              height={books[0].coverImage?.height || 450}
              className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-30 blur-2xl pointer-events-none scale-125"
            />
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-background/50 via-background/30 to-background/50 pointer-events-none" />
          </>
        )}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Книги */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">Останні книги</h2>
                <Button asChild variant="outline">
                  <Link href="/novels" className="flex items-center gap-2">
                    Переглянути всі
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {books.map((book) => {
                  if (typeof book === 'string') return null
                  return <BookCard book={book} key={book.id} />
                })}
              </div>
            </div>

            {/* Сайдбар з коментарями */}
            <div className="lg:col-span-1">
              <LatestComments />
            </div>
          </div>
        </div>
      </section>

      {/* Набувають популярності */}
      <section className="relative overflow-hidden py-8 border-b border-border/20">
        {/* Background gradient from first book cover */}
        {trendingBooks[0] && typeof trendingBooks[0].coverImage === 'object' && (
          <>
            <Image
              src={trendingBooks[0].coverImage?.url || ''}
              alt=""
              width={trendingBooks[0].coverImage?.width || 300}
              height={trendingBooks[0].coverImage?.height || 450}
              className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-30 blur-2xl pointer-events-none scale-125"
            />
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-background/50 via-background/30 to-background/50 pointer-events-none" />
          </>
        )}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">Набувають популярності</h2>
            <Button asChild variant="outline">
              <Link href="/novels" className="flex items-center gap-2">
                Переглянути всі
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {trendingBooks.map((book) => {
              if (typeof book === 'string') return null
              return <BookCard book={book} key={book.id} />
            })}
          </div>
        </div>
      </section>

      {/* Останні блог пости */}
      <section className="relative overflow-hidden py-8 border-b border-border/20">
        {/* Background gradient from first post image */}
        {posts[0] && typeof posts[0].image === 'object' && posts[0].image && (
          <>
            <Image
              src={posts[0].image?.url || ''}
              alt=""
              width={posts[0].image?.width || 300}
              height={posts[0].image?.height || 450}
              className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-30 blur-2xl pointer-events-none scale-125"
            />
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-background/50 via-background/30 to-background/50 pointer-events-none" />
          </>
        )}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">Останні блог пости</h2>
            <Button asChild variant="outline">
              <Link href="/blog" className="flex items-center gap-2">
                Переглянути всі
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.slice(0, 4).map((post) => {
              if (typeof post === 'string') return null
              return (
                <BlogCard
                  key={post.id}
                  title={post.title}
                  description={post.shortDescription}
                  image={post.image as string | Media}
                  slug={post.slug || ''}
                  publishedAt={post.publishedAt}
                />
              )
            })}
          </div>
        </div>
      </section>

      {/* Останні оновлені розділи */}
      <section className="relative overflow-hidden py-8 pb-12">
        {/* Background gradient from first chapter's book cover */}
        {recentChapters[0] &&
          typeof recentChapters[0].book === 'object' &&
          recentChapters[0].book &&
          typeof recentChapters[0].book.coverImage === 'object' && (
            <>
              <Image
                src={recentChapters[0].book.coverImage?.url || ''}
                alt=""
                width={recentChapters[0].book.coverImage?.width || 300}
                height={recentChapters[0].book.coverImage?.height || 450}
                className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-30 blur-2xl pointer-events-none scale-125"
              />
              <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-background/50 via-background/30 to-background/50 pointer-events-none" />
            </>
          )}
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Останні оновлені розділи</h2>
          <div className="space-y-1.5">
            {recentChapters.map((chapter) => {
              if (typeof chapter === 'string' || typeof chapter.book === 'string') return null
              if (!chapter.book) return null

              return (
                <Link
                  key={chapter.id}
                  href={`/redirect/novel/${chapter.id}`}
                  className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[minmax(180px,320px)_1fr_160px] gap-3 items-center p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {/* Обкладинка + Назва книги */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {typeof chapter.book.coverImage === 'object' && chapter.book.coverImage && (
                      <Image
                        src={chapter.book.coverImage.url || ''}
                        alt={chapter.book.coverImage.alt || ''}
                        width={50}
                        height={75}
                        className="rounded object-cover w-[50px] h-[75px] flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1 hidden md:block">
                      <p className="font-semibold truncate">{chapter.book.title}</p>
                    </div>
                  </div>

                  {/* Назва розділу */}
                  <div className="min-w-0">
                    <p className="truncate text-muted-foreground">{chapter.title}</p>
                  </div>

                  {/* Час */}
                  <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(chapter.updatedAt || new Date())}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
