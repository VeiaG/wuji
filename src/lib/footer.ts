import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Footer } from '@/payload-types'

export const FOOTER_CACHE_TAG = 'footer'

const fetchFooter = unstable_cache(
  async (): Promise<Footer> => {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const footer = await payload.findGlobal({
      slug: 'footer',
    })

    return footer as Footer
  },
  ['footer-global'],
  {
    tags: [FOOTER_CACHE_TAG],
    revalidate: 3600, // Ревалідація раз на годину (fallback)
  },
)

/**
 * Отримує дані футера з кешуванням (тег 'footer' для ревалідації).
 * try/catch зовні unstable_cache, щоб помилки (null) не кешувались на годину.
 */
export const getFooter = async (): Promise<Footer | null> => {
  try {
    return await fetchFooter()
  } catch (error) {
    console.error('Error fetching footer:', error)
    return null
  }
}
