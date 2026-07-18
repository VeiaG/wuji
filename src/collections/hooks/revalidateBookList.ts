import { Book } from '@/payload-types'
import { BOOK_OG_CACHE_TAG } from '@/lib/bookOg'
import { revalidatePath, revalidateTag } from 'next/cache'
import { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

export const revalidateBook: CollectionAfterChangeHook<Book> = ({
  doc,
  previousDoc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    const oldPath = `/novel/${previousDoc.slug}`
    const newPath = `/novel/${doc.slug}`

    revalidatePath(oldPath)
    revalidatePath(newPath)
    revalidatePath('/') //TODO: optimize later, e.g Separate button in admin to revalidate homepage, instead of doing it on every book change
    revalidateTag(BOOK_OG_CACHE_TAG, 'max')
  }
  return doc
}

export const revalidateDeleteBook: CollectionAfterDeleteHook<Book> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    const path = `/novel/${doc?.slug}`

    revalidatePath(path)
    revalidatePath('/') //TODO: optimize later, e.g Separate button in admin to revalidate homepage, instead of doing it on every book change
    revalidateTag(BOOK_OG_CACHE_TAG, 'max')
  }

  return doc
}
