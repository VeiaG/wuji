import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export const revalidate = 86400 //revalidate every day

const generateSitemapEntry = (
  slug: string | null | undefined,
  type: 'post' | 'book' | 'page' | 'author',
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
        : type === 'author'
          ? `${baseUrl}/author/${slug}`
          : `${baseUrl}/novel/${slug}`
  return {
    url,
    lastModified: lastModified || new Date(),
    changeFrequency: type === 'page' || type === 'author' ? 'monthly' : 'weekly',
    priority: type === 'post' ? 0.6 : type === 'page' || type === 'author' ? 0.5 : 0.9,
  }
}
// Порожній редактор Lexical зберігає кореневий вузол з порожнім абзацом — шукаємо реальний текст
const hasRichText = (node: unknown): boolean => {
  if (!node || typeof node !== 'object') return false
  const { text, root, children } = node as { text?: unknown; root?: unknown; children?: unknown }
  if (typeof text === 'string' && text.trim()) return true
  if (root) return hasRichText(root)
  return Array.isArray(children) && children.some(hasRichText)
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
    depth: 0,
    select: {
      slug: true,
      updatedAt: true,
      author: true,
    },
  })
  const allAuthors = await payload.find({
    collection: 'authors',
    limit: 0,
    depth: 0,
    select: {
      slug: true,
      updatedAt: true,
      description: true,
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

  // lastModified статичних сторінок беремо з реального контенту: якщо щоразу віддавати «зараз»,
  // Google вирішує, що lastmod недостовірний, і ігнорує його для всього sitemap
  const latest = (docs: { updatedAt: string }[]) =>
    docs.reduce<Date | undefined>((max, doc) => {
      const date = new Date(doc.updatedAt)
      return !max || date > max ? date : max
    }, undefined)
  const latestPost = latest(allBlogPosts.docs)
  const latestNovel = latest(allNovels.docs)
  const latestContent =
    latestPost && latestNovel
      ? latestPost > latestNovel
        ? latestPost
        : latestNovel
      : latestPost || latestNovel

  const baseSitemap: MetadataRoute.Sitemap = [
    {
      url: 'https://wuji.world/',
      lastModified: latestContent,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://wuji.world/novels',
      lastModified: latestNovel,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://wuji.world/originals',
      lastModified: latestNovel,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://wuji.world/blog',
      lastModified: latestPost,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    { url: 'https://wuji.world/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://wuji.world/terms', changeFrequency: 'yearly', priority: 0.3 },
  ]

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

  // Більшість сторінок авторів — лише одна книга без опису, тобто дубль сторінки книги.
  // Додаємо лише тих, у кого є опис або щонайменше дві книги
  const booksPerAuthor = new Map<string, number>()
  for (const novel of allNovels.docs) {
    const authorId = typeof novel.author === 'string' ? novel.author : novel.author?.id
    if (authorId) booksPerAuthor.set(authorId, (booksPerAuthor.get(authorId) ?? 0) + 1)
  }
  const authorEntries =
    (allAuthors.docs
      ?.filter(
        (author) => hasRichText(author.description) || (booksPerAuthor.get(author.id) ?? 0) >= 2,
      )
      .map((author) => generateSitemapEntry(author.slug, 'author', new Date(author.updatedAt)))
      .filter(Boolean) as MetadataRoute.Sitemap) || []

  // Сторінка з колекції може збігатися зі статичним маршрутом (напр. /about) — прибираємо дублікати
  const seen = new Set<string>()
  return [
    ...baseSitemap,
    ...pageEntries,
    ...blogPostsEntries,
    ...novelEntries,
    ...authorEntries,
  ].filter((entry) => {
    if (seen.has(entry.url)) return false
    seen.add(entry.url)
    return true
  })
}
