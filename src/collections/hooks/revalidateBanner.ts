import { revalidateTag } from 'next/cache'
import { GlobalAfterChangeHook } from 'payload'
import { BANNER_CACHE_TAG } from '@/lib/banner'

/**
 * Hook для автоматичної ревалідації кешу банера при зміні в CMS
 */
export const revalidateBanner: GlobalAfterChangeHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidateTag(BANNER_CACHE_TAG)
    console.log('Banner cache revalidated via hook')
  }
  return doc
}
