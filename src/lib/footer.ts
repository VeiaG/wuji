import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Footer } from '@/payload-types'

export const FOOTER_CACHE_TAG = 'footer'

/**
 * Отримує дані футера з кешуванням
 * Використовує unstable_cache з тегом 'footer' для можливості ревалідації
 */
export const getFooter = unstable_cache(
  async (): Promise<Footer | null> => {
    try {
      const payloadConfig = await config
      const payload = await getPayload({ config: payloadConfig })

      const footer = await payload.findGlobal({
        slug: 'footer',
      })

      return footer as Footer
    } catch (error) {
      console.error('Error fetching footer:', error)
      return null
    }
  },
  ['footer-global'],
  {
    tags: [FOOTER_CACHE_TAG],
    revalidate: 3600, // Ревалідація раз на годину (fallback)
  },
)
