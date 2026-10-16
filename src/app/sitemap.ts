import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export const revalidate = 86400 //revalidate every day

const baseSitemap: MetadataRoute.Sitemap = [
  {
    url: 'https://wuji.world/',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    url: 'https://wuji.world/novels',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: 'https://wuji.world/originals',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: 'https://wuji.world/privacy',
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: 'https://wuji.world/terms',
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: 'https://wuji.world/blog',
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  },
]
const generateSitemapEntry = (
  slug: string | null | undefined,
  type: 'post' | 'book' | 'page',
  lastModified?: Date,
): MetadataRoute.Sitemap[number] | null => {
  const baseUrl = 'https://wuji.world'
  if (!slug) {
    return null
  }
  const url =
    type === 'post'
      ? `${baseUrl}/blog/${slug}`
      : type === 'page'
        ? `${baseUrl}/${slug}`
        : `${baseUrl}/novel/${slug}`
  return {
    url,
    lastModified: lastModified || new Date(),
    changeFrequency: type === 'page' ? 'monthly' : 'weekly',
    priority: type === 'post' ? 0.6 : type === 'page' ? 0.5 : 0.9,
  }
}
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const allBlogPosts = await payload.find({
    collection: 'posts',
    limit: 0,
    draft: false,
    where: {
      _status: {
        equals: 'published',
      },
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  })
  const allNovels = await payload.find({
    collection: 'books',
    limit: 0,
    select: {
      slug: true,
      updatedAt: true,
    },
  })
  // Лише опубліковані сторінки — чернетки не мають потрапляти в sitemap
  const allPages = await payload.find({
    collection: 'pages',
    limit: 0,
    draft: false,
    where: {
      _status: {
        equals: 'published',
      },
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  })

  const blogPostsEntries =
    (allBlogPosts.docs
      ?.map((post) => generateSitemapEntry(post.slug, 'post', new Date(post.updatedAt)))
      .filter(Boolean) as MetadataRoute.Sitemap) || []
  const novelEntries =
    (allNovels.docs
      ?.map((novel) => generateSitemapEntry(novel.slug, 'book', new Date(novel.updatedAt)))
      .filter(Boolean) as MetadataRoute.Sitemap) || []
  const pageEntries =
    (allPages.docs
      ?.map((page) => generateSitemapEntry(page.slug, 'page', new Date(page.updatedAt)))
      .filter(Boolean) as MetadataRoute.Sitemap) || []

  // Сторінка з колекції може збігатися зі статичним маршрутом (напр. /about) — прибираємо дублікати
  const seen = new Set<string>()
  return [...baseSitemap, ...pageEntries, ...blogPostsEntries, ...novelEntries].filter((entry) => {
    if (seen.has(entry.url)) return false
    seen.add(entry.url)
    return true
  })
}
