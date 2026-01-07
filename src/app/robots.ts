import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog/',
        ],
        disallow: [
          '/redirect/',
          '/novel/*/editor',
          '/novel/*/*',
          '/novels/',
          '/blog$', // ТІЛЬКИ список постів
          '/profile/',
          '/settings/',
          '/login/',
          '/register/',
          '/forgot-password/',
          '/reset-password/',
          '/verify/',
          '/admin/',
        ],
      },
    ],
    sitemap: 'https://wuji.world/sitemap.xml',
  }
}
