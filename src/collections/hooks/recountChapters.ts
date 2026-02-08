import { BookChapter } from '@/payload-types'
import { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

const recountChaptersOnDelete: CollectionAfterDeleteHook<BookChapter> = async ({
  doc,
  req: { payload, context },
}) => {
  if (!doc.book) return
  if (context?.skipRecountingChapters) {
    payload.logger.info(
      `Skipping recounting chapters for book: ${typeof doc.book === 'string' ? doc.book : doc.book.title}`,
    )
    return
  }

  const chapterCount = await payload.count({
    collection: 'bookChapters',
    where: {
      book: {
        equals: typeof doc.book === 'string' ? doc.book : doc.book.id,
      },
    },
  })

  await payload.update({
    collection: 'books',
    id: typeof doc.book === 'string' ? doc.book : doc.book.id,
    data: {
      chapterCount: chapterCount.totalDocs,
    },
  })
}

const recountChaptersOnChange: CollectionAfterChangeHook<BookChapter> = async ({
  doc,
  operation,
  req: { payload, context },
}) => {
  //Skip recounting if the book is not changed
  if (operation === 'update' && doc.book) return
  if (!doc.book) return

  if (context?.skipRecountingChapters) {
    payload.logger.info(
      `Skipping recounting chapters for book: ${typeof doc.book === 'string' ? doc.book : doc.book.title}`,
    )
    return
  }

  payload.logger.info(
    `Recounting chapters for book: ${typeof doc.book === 'string' ? doc.book : doc.book.title}`,
  )

  const chapterCount = await payload.count({
    collection: 'bookChapters',
    where: {
      book: {
        equals: typeof doc.book === 'string' ? doc.book : doc.book.id,
      },
    },
  })

  await payload.update({
    collection: 'books',
    id: typeof doc.book === 'string' ? doc.book : doc.book.id,
    data: {
      chapterCount: chapterCount.totalDocs,
    },
  })
}

export { recountChaptersOnDelete, recountChaptersOnChange }
