import { queryChapterByBookAndIndex } from '@/queries'
import { notFound } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'
import config from '@payload-config'
import ReadClientPage from './page.client'
import { Metadata } from 'next'
import { getServerSideURL } from '@/lib/getURL'

type Args = {
  params: Promise<{
    slug?: string
    page?: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const ReadPage: React.FC<Args> = async ({ params, searchParams }) => {
  const { slug = '', page = '' } = await params
  const sp = await searchParams

  const chapter = await queryChapterByBookAndIndex({
    bookSlug: slug,
    index: Number(page),
  })
  if (!chapter) {
    notFound()
  }

  return (
    <ReadClientPage
      chapter={chapter}
      page={Number(page)}
      bookSlug={slug}
      disableSaving={!!sp.disableSaving}
    />
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '', page = '1' } = await paramsPromise
  const chapter = await queryChapterByBookAndIndex({
    bookSlug: slug,
    index: Number(page),
  })
  //remove images property entirely from metadata, and set them to our og image
  const ogImage = `${getServerSideURL()}/novel/${slug}/og`

  const book = typeof chapter.book === 'string' ? undefined : chapter.book
  const title = `ВуЧи - ${book?.title} : ${chapter.title}`
  return {
    title: title,
    description: book?.meta?.description,
    openGraph: {
      title: title,
      description: book?.meta?.description ?? undefined,
      images: [ogImage],
    },
  }
}

export default ReadPage
