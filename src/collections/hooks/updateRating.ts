import { Review } from '@/payload-types'
import { BasePayload, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { extractID } from 'payload/shared'

async function updateBookRating(payload: BasePayload, bookId: string) {
  const reviews = await payload.find({
    collection: 'reviews',
    where: { book: { equals: bookId } },
    select: { rating: true },
    limit: 0,
  })

  const avgRating =
    reviews.totalDocs > 0
      ? reviews.docs.reduce((sum, r) => sum + r.rating, 0) / reviews.totalDocs
      : 0

  await payload.update({
    collection: 'books',
    id: bookId,
    data: {
      reviewsStats: {
        averageRating: avgRating,
        totalReviews: reviews.totalDocs,
      },
    },
  })
}

export const updateRatingAfterChange: CollectionAfterChangeHook<Review> = async ({
  doc,
  req: { payload },
}) => {
  await updateBookRating(payload, extractID(doc.book))
}

export const updateRatingAfterDelete: CollectionAfterDeleteHook<Review> = async ({
  doc,
  req: { payload },
}) => {
  await updateBookRating(payload, extractID(doc.book))
}
