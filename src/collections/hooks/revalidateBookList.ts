import { Book } from '@/payload-types'
import { revalidatePath } from 'next/cache'
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
    //TODO - add bettter revalidation logic
    revalidatePath('/books')
    revalidatePath('/')
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
    //TODO - add better revalidation logic
    revalidatePath('/books')
    revalidatePath('/')
  }

  return doc
}
