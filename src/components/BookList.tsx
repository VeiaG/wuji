import React from 'react'

import config from '@/payload.config'
import { getPayload } from 'payload'
import { BookCard } from './BookCard'

const BookList = async () => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const books = await payload.find({
    collection: 'books',
    limit: 6,
    select: {
      title: true,
      slug: true,
      coverImage: true,
      genres: true,
    },
  })
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
      {books?.docs?.map((book) => {
        if (typeof book === 'string') return null
        return <BookCard book={book} key={book.id} />
      })}
    </div>
  )
}

export default BookList
