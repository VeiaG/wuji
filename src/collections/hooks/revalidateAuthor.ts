import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'
import { Author } from '@/payload-types'

export const revalidateAuthor: CollectionAfterChangeHook<Author> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const path = `/author/${doc.slug}`

    payload.logger.info(`Revalidating author at path: ${path}`)

    revalidatePath(path)

    const oldPath = `/author/${previousDoc.slug}`

    payload.logger.info(`Revalidating old author at path: ${oldPath}`)

    revalidatePath(oldPath)
  }
  return doc
}

export const revalidateDeleteAuthor: CollectionAfterDeleteHook<Author> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    const path = `/author/${doc?.slug}`

    revalidatePath(path)
  }

  return doc
}
