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
    url: 'https://wuji.world/about',
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
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
  type: 'post' | 'book',
  lastModified?: Date,
): MetadataRoute.Sitemap[number] | null => {
  const baseUrl = 'https://wuji.world'
  if (!slug) {
    return null
  }
  const url = type === 'post' ? `${baseUrl}/blog/${slug}` : `${baseUrl}/novel/${slug}`
  return {
    url,
    lastModified: lastModified || new Date(),
    changeFrequency: 'weekly',
    priority: type === 'post' ? 0.6 : 0.9,
  }
}
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const allBlogPosts = await payload.find({
    collection: 'posts',
    limit: 0,
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

  const blogPostsEntries =
    (allBlogPosts.docs
      ?.map((post) => generateSitemapEntry(post.slug, 'post', new Date(post.updatedAt)))
      .filter(Boolean) as MetadataRoute.Sitemap) || []
  const novelEntries =
    (allNovels.docs
      ?.map((novel) => generateSitemapEntry(novel.slug, 'book', new Date(novel.updatedAt)))
      .filter(Boolean) as MetadataRoute.Sitemap) || []
  return [...baseSitemap, ...blogPostsEntries, ...novelEntries]
}
