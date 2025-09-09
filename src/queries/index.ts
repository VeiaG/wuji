import { getPayload } from 'payload'
import config from '@payload-config'
import { cache } from 'react'
import { ReadProgress, User } from '@/payload-types'
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
    select: {
      chapters: false, //we don't need chapters in the book query , we will fetch them separately on client side, for performance reasons
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
      //sort by internal join field order
      sort: '_bookChapters_chapters_order',
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

export const queryAuthorBySlug = cache(async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: config })

  const result = await payload.find({
    collection: 'authors',
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
    populate: {
      books: {
        title: true,
        slug: true,
        coverImage: true,
        meta: true,
      },
    },
  })

  return result.docs?.[0] || null
})

export type UserWithReadProgress = User & {
  readProgresses?: ReadProgress[]
}

export const queryUserBySlug = cache(async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: config })

  const result = await payload.find({
    collection: 'users',
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const user = result.docs?.[0]
  if (!user) return null

  // If profile is public, fetch read progresses
  if (user.isPublic) {
    const readProgressResult = await payload.find({
      collection: 'readProgress',
      where: {
        user: {
          equals: user.id,
        },
      },
      populate: {
        books: {
          title: true,
          slug: true,
          coverImage: true,
          chapterCount: true,
          genres: true,
        },
      },
      limit: 10,
      sort: '-updatedAt',
    })

    return {
      ...user,
      readProgresses: readProgressResult.docs,
    } as UserWithReadProgress
  }

  return user as UserWithReadProgress
})
