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
          '/profile/',
          '/settings/',
          '/login/',
          '/register/',
          '/forgot-password/',
          '/reset-password/',
          '/verify/',
        ],
      },
    ],
    sitemap: 'https://wuji.world/sitemap.xml',
  }
}
