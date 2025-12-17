import { notFound } from 'next/navigation'
import { queryBookBySlug } from '@/queries'
import { Metadata } from 'next'
import { generateMeta } from '@/lib/generateMeta'
import { getServerSideURL } from '@/lib/getURL'
import type { Book, WithContext } from 'schema-dts'
import NovelPageClient from './page.client'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const NovelPage: React.FC<Args> = async ({ params }) => {
  const { slug = '' } = await params
  const book = await queryBookBySlug({ slug })
  if (!book) return notFound()
  const jsonLd: WithContext<Book> = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    alternateName: book.alternativeNames?.[0] ?? undefined,
    image:
      typeof book.coverImage === 'object'
        ? book.coverImage.url
          ? getServerSideURL() + book.coverImage.url
          : undefined
        : undefined,
    description: book.meta?.description ?? undefined,
    author: typeof book.author !== 'string' ? book.author.name : undefined,
    genre: book.genres
      ?.map((g) => (typeof g === 'string' ? null : g.title))
      ?.filter(Boolean) as string[],
  }
  return (
    <>
      <NovelPageClient book={book} slug={slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
    </>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const book = await queryBookBySlug({ slug })
  const metadata = await generateMeta({
    doc: book,
    titleSuffix: '| Читати ранобе українською онлайн',
    tags: book.genres
      ?.map((g) => (typeof g === 'string' ? null : g.title))
      ?.filter(Boolean) as string[],
  })
  //remove images property entirely from metadata, and set them to our og image
  const ogImage = `${getServerSideURL()}/novel/${slug}/og`

  if (metadata.openGraph) {
    metadata.openGraph.images = [ogImage]
  } else {
    metadata.openGraph = {
      images: [ogImage],
    }
  }

  return metadata
}
export default NovelPage
