// app/(frontend)/redirect/novel/[id]/page.tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect, notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RedirectToChapter({ params }: PageProps) {
  const { id } = await params
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
  redirect(`/novel/${bookSlug}/${index + 1}`)
}

// Опціонально: додай metadata
export async function generateMetadata({ params }: PageProps) {
  return {
    title: 'Redirecting...',
    robots: 'noindex, nofollow', // Важливо для SEO
  }
}
