import React, { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
// import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import RichText from '@/components/RichText'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import SharePost from '@/components/SharePost'
import { Tile } from '@/components/bento'
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
  const imageUrl = typeof post.image === 'string' ? post.image : post.image?.url

  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <Tile className="mx-auto flex w-full max-w-[760px] flex-col gap-6 p-6 md:p-10">
        <Link
          href="/blog"
          className="inline-flex w-fit items-center gap-1.5 text-[15px] font-semibold text-primary hover:opacity-90"
        >
          <ArrowLeft className="size-4" />
          Назад до блогу
        </Link>
        <div className="flex flex-col gap-3">
          <h1 className="heading-display text-[clamp(28px,4vw,44px)]">{post.title}</h1>
          {post.publishedAt && (
            <span className="text-sm text-muted-foreground">
              {new Date(post.publishedAt).toLocaleDateString('uk-UA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={post.title}
            sizes="(min-width: 800px) 680px, 100vw"
            className="aspect-video h-auto w-full rounded-2xl object-cover"
            style={{ width: '100%', height: 'auto' }}
            width={0}
            height={0}
            priority
          />
        )}

        <RichText
          data={post.content}
          className="w-full text-[16px] prose-p:leading-relaxed prose-p:text-soft prose-li:text-soft prose-headings:font-display prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-2xl md:text-[17px]"
        />
        <SharePost />
      </Tile>
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
