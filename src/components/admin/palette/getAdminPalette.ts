import { headers } from 'next/headers'
import { getPayload, type SanitizedConfig } from 'payload'
import { getPreferences } from '@payloadcms/ui/rsc'
import { PALETTE_PREFERENCE_KEY, palettes, type PaletteId } from '@/lib/palettes'

/**
 * Палітра адмінки з налаштувань користувача (payload-preferences) — для `data-palette` на
 * <html> ще на сервері, щоб не блимав дефолтний мандарин до гідрації.
 * Без збереженої палітри (або без користувача) — undefined: тоді працює дефолт із CSS,
 * а клієнтський PaletteProvider підхопить localStorage і збереже вибір у налаштування.
 */
export async function getAdminPalette(
  config: Promise<SanitizedConfig> | SanitizedConfig,
): Promise<PaletteId | undefined> {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user) return undefined

    const preference = await getPreferences<string>(
      PALETTE_PREFERENCE_KEY,
      payload,
      user.id,
      user.collection,
    )
    const value = preference?.value
    return palettes.some((p) => p.id === value) ? (value as PaletteId) : undefined
  } catch {
    return undefined
  }
}
