import React, { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
// import { Metadata } from 'next'
import { notFound } from 'next/navigation'
//TODO : update lexical from canary to stable release , when they fix image issue
import Image from 'next/image'
import RichText from '@/components/RichText'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import SharePost from '@/components/SharePost'
import { Metadata } from 'next'
import { generateMeta } from '@/lib/generateMeta'

export async function generateStaticParams() {
  const payload = await getPayload({ config: config })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}
type Args = {
  params: Promise<{
    slug?: string
  }>
}

const PostPage = async ({ params }: Args) => {
  const { slug = '' } = await params
  const post = await queryPostBySlug({ slug })
  if (!post) return notFound()
  return (
    <div className="py-4 md:py-8 container mx-auto max-w-[900px] text-lg relative">
      <Link
        href="/blog"
        className=" flex gap-1 items-center z-10 hover:underline  transition-transform hover:-translate-y-0.5 mb-6"
      >
        <ArrowLeft />
        <span>Назад до блогу</span>
      </Link>
      <div className="flex flex-col gap-4 justify-center col-span-2 mb-12">
        <h1 className="text-3xl md:text-5xl font-bold">{post.title}</h1>
        <Image
          src={(typeof post.image === 'string' ? post.image : post.image.url) || ''}
          alt={post.title}
          sizes="100vw"
          className="object-cover h-auto w-full aspect-video rounded-lg"
          style={{ width: '100%', height: 'auto' }}
          width={0}
          height={0}
        />
      </div>

      <RichText data={post.content} />
      <SharePost />
    </div>
  )
}
export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const post = await queryPostBySlug({ slug })

  return generateMeta({ doc: post })
}
const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: config })

  const result = await payload.find({
    collection: 'posts',
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

export default PostPage
