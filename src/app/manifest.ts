import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ВуЧи',
    short_name: 'ВуЧи',
    description: 'Ранобе українською — японські, корейські й китайські новели безкоштовно.',
    start_url: '/',
    display: 'standalone',
    // Фон палітри tangerine
    background_color: '#0d0b0a',
    theme_color: '#0d0b0a',
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // Android обрізає іконку під свою форму — тут літери в безпечній зоні
        src: '/web-app-manifest-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
