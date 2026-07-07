import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ArrowLeft, Bot } from 'lucide-react'
import { queryBookBySlug } from '@/queries'
import { isSpoiler, queryWikiEntriesByBook, queryWikiReaderProgress } from '@/queries/wiki'
import { Badge } from '@/components/ui/badge'
import WikiExplorer, { type WikiExplorerEntry } from '@/components/wiki/wiki-explorer'
import SpoilerToggle from '@/components/wiki/spoiler-toggle'

type Args = {
  params: Promise<{ slug?: string }>
  searchParams: Promise<{ spoilers?: string }>
}

const WikiIndexPage = async ({ params, searchParams }: Args) => {
  const { slug = '' } = await params
  const { spoilers } = await searchParams
  const spoilersShown = spoilers === '1'

  const book = await queryBookBySlug({ slug })
  if (!book) return notFound()

  const [entries, readerProgress] = await Promise.all([
    queryWikiEntriesByBook({ bookId: book.id }),
    queryWikiReaderProgress({ bookId: book.id }),
  ])
  // no wiki generated for this book — the page does not exist
  if (entries.length === 0) return notFound()

  const visible = spoilersShown
    ? entries
    : entries.filter((entry) => !isSpoiler(entry.spoilerChapterIndex, readerProgress))
  const hiddenCount = entries.length - visible.length

  const explorerEntries: WikiExplorerEntry[] = visible.map((entry) => ({
    id: entry.id,
    title: entry.title,
    slug: entry.slug,
    type: entry.type,
    shortDescription: entry.shortDescription,
    imageUrl: typeof entry.image === 'object' ? entry.image?.url : null,
    firstAppearanceIndex: entry.firstAppearanceIndex,
    isAuto: entry.status === 'auto',
  }))

  return (
    <div className="container mx-auto py-4 md:py-8 space-y-6">
      {typeof book.coverImage === 'object' && (
        <Image
          src={book.coverImage?.url || ''}
          alt={book.coverImage?.alt || ''}
          width={book.coverImage?.width || 300}
          height={book.coverImage?.height || 450}
          className="fixed top-0 left-0 w-screen h-screen object-cover -z-10 opacity-15 blur-xl pointer-events-none"
          priority
        />
      )}

      {/* Header */}
      <div className="space-y-2">
        <Link
          href={`/novel/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          {book.title}
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-bold">Вікі</h1>
          <Badge variant="secondary">бета</Badge>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 max-w-2xl">
          <Bot className="size-4 shrink-0" />
          Статті згенеровано штучним інтелектом на основі розділів книги — можливі неточності.
        </p>
      </div>

      <SpoilerToggle
        basePath={`/novel/${slug}/wiki`}
        spoilersShown={spoilersShown}
        readerProgress={readerProgress}
        hiddenCount={hiddenCount}
      />

      <WikiExplorer entries={explorerEntries} bookSlug={slug} spoilersShown={spoilersShown} />
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = '' } = await params
  const book = await queryBookBySlug({ slug })
  if (!book) return {}

  return {
    title: `Вікі — ${book.title} | Читати ранобе українською онлайн`,
    description: `Вікі до «${book.title}»: персонажі, локації, техніки та інші сутності світу книги.`,
    // AI-generated beta content — keep out of search indexes for now
    robots: { index: false, follow: true },
  }
}

export default WikiIndexPage
