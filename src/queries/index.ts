import { getPayload } from 'payload'
import config from '@payload-config'
import { cache } from 'react'
// import { notFound } from 'next/navigation'

//used in novel Page
export const queryBookBySlug = cache(async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: config })

  const result = await payload.find({
    collection: 'books',
    limit: 1,
    pagination: false,
    depth: 2,
    where: {
      slug: {
        equals: slug,
      },
    },
    joins: {
      chapters: {
        limit: 0,
      },
    },
    populate: {
      bookChapters: {
        title: true,
        addedAt: true,
        isSpoiler: true,
      },
      bookGenres: {
        title: true,
      },
    },
  })

  return result.docs?.[0] || null
})

export const queryChapterByBookAndIndex = cache(
  async ({ bookSlug, index }: { bookSlug: string; index: number }) => {
    const payload = await getPayload({ config: config })

    const result = await payload.find({
      collection: 'bookChapters',
      limit: 1,
      page: index,
      pagination: true,
      where: {
        'book.slug': {
          equals: bookSlug,
        },
      },
      populate: {
        books: {
          title: true,
          slug: true,
          coverImage: true,
        },
      },
    })
    // console.log('Found chapter:', result.docs?.[0])
    return result.docs?.[0] || null
  },
)
