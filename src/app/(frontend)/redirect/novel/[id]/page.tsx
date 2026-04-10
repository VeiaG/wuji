// app/(frontend)/redirect/novel/[id]/page.tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect, notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function RedirectToChapter({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams
  const payload = await getPayload({ config })

  // Отримуємо розділ
  const chapter = await payload.findByID({
    collection: 'bookChapters',
    id,
    depth: 1,
  })

  if (!chapter) {
    notFound()
  }

  const bookSlug = typeof chapter.book === 'string' ? chapter.book : chapter.book.slug

  // Знаходимо індекс
  const allChapters = await payload.find({
    collection: 'bookChapters',
    where: {
      book: { equals: typeof chapter.book === 'string' ? chapter.book : chapter.book.id },
    },
    sort: '_bookChapters_chapters_order',
    limit: 0, // отримати всі розділи
    depth: 0,
    select: {},
  })

  const index = allChapters.docs.findIndex((ch) => ch.id === id)

  if (index === -1) {
    notFound()
  }

  // Redirect на правильний URL (1-based index)
  const queryString = sp.disableSaving ? '?disableSaving=true' : ''
  redirect(`/novel/${bookSlug}/${index + 1}${queryString}`)
}

// Опціонально: додай metadata
export async function generateMetadata() {
  return {
    title: 'Redirecting...',
    robots: 'noindex, nofollow', // Важливо для SEO
  }
}
