import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import './styles.css'
import { BookGenre, Media } from '@/payload-types'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const BookCard: React.FC<{
  book: {
    id: string
    title: string
    coverImage: string | Media
    genres: (string | BookGenre)[]
    slug?: string | null | undefined
  }
}> = ({ book }) => {
  return (
    <Link href={`/novel/${book.slug}`} className="flex flex-col gap-2">
      {typeof book.coverImage === 'object' && (
        <Image
          src={book.coverImage?.url || ''}
          alt={book.coverImage?.alt}
          width={book.coverImage?.width || 300}
          height={book.coverImage?.height || 300}
          className="rounded-lg aspect-[1/1.5] object-cover w-full max-w-[350px]"
        />
      )}
      <h2 className="text-xl font-bold">{book.title}</h2>
      <div className=" gap-2 flex-wrap hidden md:flex">
        {book.genres?.map((genre) => {
          if (typeof genre === 'string') return null
          return (
            <Badge key={genre.id} className="text-sm" variant="outline">
              {genre.title}
            </Badge>
          )
        })}
      </div>
    </Link>
  )
}
export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const books = await payload.find({
    collection: 'books',
    limit: 10,
    sort: '-createdAt',
    select: {
      title: true,
      slug: true,
      coverImage: true,
      genres: true,
    },
  })
  return (
    <div className="container mx-auto py-4">
      <h1 className="text-2xl font-bold mb-4">Усі ранобе:</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {books?.docs?.map((book) => {
          if (typeof book === 'string') return null
          return <BookCard book={book} key={book.id} />
        })}
      </div>
    </div>
  )
}
