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
    overrideAccess: true,
  })

  await payload.update({
    collection: 'books',
    id: typeof doc.book === 'string' ? doc.book : doc.book.id,
    data: {
      chapterCount: chapterCount.totalDocs,
    },
    overrideAccess: true,
  })
}

const bookIdOf = (book: BookChapter['book'] | undefined): string | null =>
  !book ? null : typeof book === 'string' ? book : book.id

/**
 * Перераховує книги, склад яких змінився: при створенні — книгу розділу, при оновленні —
 * стару й нову, якщо розділ переїхав в іншу книгу або в заявку (без книги).
 */
const recountChaptersOnChange: CollectionAfterChangeHook<BookChapter> = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const { payload, context } = req
  const next = bookIdOf(doc.book)
  const prev = operation === 'update' ? bookIdOf(previousDoc?.book) : null
  //Skip recounting if the book is not changed
  if (operation === 'update' && prev === next) return

  const affected = [...new Set([prev, next].filter((id): id is string => Boolean(id)))]
  if (affected.length === 0) return

  if (context?.skipRecountingChapters) {
    payload.logger.info(`Skipping recounting chapters for books: ${affected.join(', ')}`)
    return
  }

  for (const bookId of affected) {
    payload.logger.info(`Recounting chapters for book: ${bookId}`)
    const chapterCount = await payload.count({
      collection: 'bookChapters',
      where: { book: { equals: bookId } },
      overrideAccess: true,
      req,
    })
    await payload.update({
      collection: 'books',
      id: bookId,
      data: { chapterCount: chapterCount.totalDocs },
      overrideAccess: true,
      req,
    })
  }
}

export { recountChaptersOnDelete, recountChaptersOnChange }
