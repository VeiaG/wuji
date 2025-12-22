import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

import { revalidatePath } from 'next/cache'

export const revalidateHomeGlobal: GlobalAfterChangeHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidatePath('/')
  }
  return doc
}

export const revalidateHomeCollection: CollectionAfterChangeHook = ({
  doc,
  req: { context },
  operation,
}) => {
  if (!context.disableRevalidate && operation === 'create') {
    // Only revalidate on create to avoid excessive revalidation on updates
    revalidatePath('/')
  }
  return doc
}
