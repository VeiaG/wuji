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

  const books = booksData.docs
  const trendingBooks = trendingBooksData.docs
  const posts = postsData.docs

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Основний контент */}
        <div className="lg:col-span-3 space-y-12">
          {/* Останні книги */}
          <section className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-border/50">
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
          </section>

          {/* Набувають популярності */}
          <section className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-border/50">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">Набувають популярності</h2>
              <Button asChild variant="outline">
                <Link href="/novels" className="flex items-center gap-2">
                  Переглянути всі
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {trendingBooks.map((book) => {
                if (typeof book === 'string') return null
                return <BookCard book={book} key={book.id} />
              })}
            </div>
          </section>

          {/* Останні блог пости */}
          <section className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-border/50">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">Останні блог пости</h2>
              <Button asChild variant="outline">
                <Link href="/blog" className="flex items-center gap-2">
                  Переглянути всі
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
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
          </section>
        </div>

        {/* Сайдбар */}
        <div className="lg:col-span-1 space-y-8">
          <LatestComments />
        </div>
      </div>
    </div>
  )
}
