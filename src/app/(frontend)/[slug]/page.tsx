import React, { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { Metadata } from 'next'
import { generateMeta } from '@/lib/generateMeta'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { DraftPreview } from '@/components/DraftPreview'

export async function generateStaticParams() {
  const payload = await getPayload({ config: config })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = pages.docs
    .filter(({ slug }) => Boolean(slug))
    .map(({ slug }) => {
      return { slug }
    })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const DynamicPage = async ({ params }: Args) => {
  const { slug = '' } = await params
  const { isEnabled: draft } = await draftMode()
  const page = await queryPageBySlug(slug, draft)
  if (!page) return notFound()

  return (
    // Блоки самі задають контейнер (як на головній), тут лише вертикальний ритм
    <div className="flex flex-col gap-3.5 pt-2">
      {draft && <DraftPreview path={`/${slug}`} />}
      <RenderBlocks blocks={page.layout} />
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const { isEnabled: draft } = await draftMode()
  const page = await queryPageBySlug(slug, draft)

  return generateMeta({ doc: page })
}

// Аргументи — примітиви, щоб react cache дедуплікував виклики між generateMetadata та рендером.
// У draft mode (лише адміни, див. /next/preview) читаємо останню чернетку.
const queryPageBySlug = cache(async (slug: string, draft: boolean) => {
  const payload = await getPayload({ config: config })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    depth: 2,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

export default DynamicPage
