import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Banner } from '@/payload-types'

export const BANNER_CACHE_TAG = 'banner'

/**
 * Отримує дані банера з кешуванням
 * Використовує unstable_cache з тегом 'banner' для можливості ревалідації
 */
export const getBanner = unstable_cache(
  async (): Promise<Banner | null> => {
    try {
      const payloadConfig = await config
      const payload = await getPayload({ config: payloadConfig })

      const banner = await payload.findGlobal({
        slug: 'banner',
      })

      return banner as Banner
    } catch (error) {
      console.error('Error fetching banner:', error)
      return null
    }
  },
  ['banner-global'],
  {
    tags: [BANNER_CACHE_TAG],
    revalidate: 3600, // Ревалідація раз на годину (fallback)
  },
)
