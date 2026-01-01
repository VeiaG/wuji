import { getBanner } from '@/lib/banner'
import { Banner } from './banner'

/**
 * Server компонент для фетчингу банера з кешуванням
 * Передає дані в client компонент для обробки localStorage
 */
export async function BannerWrapper() {
  const banner = await getBanner()

  // Не показуємо банер якщо він не активний або немає даних
  if (!banner?.enabled || !banner?.settings) {
    return null
  }

  return <Banner banner={banner} />
}
