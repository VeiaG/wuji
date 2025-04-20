import { queryChapterByBookAndIndex } from '@/queries'
import { notFound } from 'next/navigation'
import React from 'react'
import ReadClientPage from './page.client'

type Args = {
  params: Promise<{
    slug?: string
    page?: string
  }>
}
const ReadPage: React.FC<Args> = async ({ params }) => {
  const { slug = '', page = '' } = await params

  const chapter = await queryChapterByBookAndIndex({
    bookSlug: slug,
    index: Number(page),
  })
  if (!chapter) {
    notFound()
  }

  return <ReadClientPage chapter={chapter} page={Number(page)} bookSlug={slug} />
}

export default ReadPage
