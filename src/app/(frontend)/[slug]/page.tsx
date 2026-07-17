import React, { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { generateMeta } from '@/lib/generateMeta'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'

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
  const page = await queryPageBySlug(slug)
  if (!page) return notFound()

  return (
    <div className="space-y-0">
      <RenderBlocks blocks={page.layout} />
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const page = await queryPageBySlug(slug)

  return generateMeta({ doc: page })
}

// Аргумент — примітив, щоб react cache дедуплікував виклики між generateMetadata та рендером
const queryPageBySlug = cache(async (slug: string) => {
  const payload = await getPayload({ config: config })

  const result = await payload.find({
    collection: 'pages',
    limit: 1,
    pagination: false,
    overrideAccess: false,
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
