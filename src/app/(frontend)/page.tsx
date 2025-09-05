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
  const posts = postsData.docs

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Основний контент */}
        <div className="lg:col-span-3 space-y-12">
          {/* Останні книги */}
          <section>
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

          {/* Останні блог пости */}
          <section>
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
                    isOnHomepage={true}
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
