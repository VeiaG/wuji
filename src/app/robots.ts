import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/novel/*/editor',
          '/novel/*/*', // розділи
          '/novels/', // Список новел
          '/blog/', // Список постів
          '/profile/',
          '/settings/',
          '/login/',
          '/register/',
          '/forgot-password/',
          '/reset-password/',
          '/verify/',
          '/admin/'
        ],
      },
    ],
    sitemap: 'https://wuji.world/sitemap.xml',
  }
}
