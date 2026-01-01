'use server'

import { revalidateTag } from 'next/cache'
import { BANNER_CACHE_TAG } from '@/lib/banner'

/**
 * Server action для ревалідації кешу банера
 * Викликається автоматично через afterChange hook в Banner.ts
 */
export async function revalidateBanner() {
  revalidateTag(BANNER_CACHE_TAG)
  console.log('Banner cache revalidated')
}
