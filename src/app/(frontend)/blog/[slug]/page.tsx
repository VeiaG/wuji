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
import { StatTile, Tile } from '@/components/bento'
import { formatPostDate } from '@/components/PostCard'
import { extractPlainText } from '@/lib/extractPlainText'
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
  const otherPosts = await queryOtherPosts({ excludeId: post.id })
  // ~200 слів за хвилину
  const words = extractPlainText(post.content).split(/\s+/).filter(Boolean).length
  const readingMinutes = Math.max(1, Math.round(words / 200))

  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      {/* Назва — окремою плиткою над контентом */}
      <Tile className="flex flex-col gap-4 p-6 md:p-9">
        <Link
          href="/blog"
          className="inline-flex w-fit items-center gap-1.5 text-[15px] font-semibold text-primary hover:opacity-90"
        >
          <ArrowLeft className="size-4" />
          Блог
        </Link>
        <h1 className="heading-display max-w-[980px] text-[clamp(28px,4vw,52px)]">{post.title}</h1>
        {post.shortDescription && (
          <p className="max-w-[760px] text-[16px] leading-relaxed text-soft md:text-[18px]">
            {post.shortDescription}
          </p>
        )}
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {post.publishedAt && <span>{formatPostDate(post.publishedAt)}</span>}
        </span>
      </Tile>

      {/* Обкладинка 16:9 і стаття в основній колонці, бокові плитки поруч */}
      <section className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-3.5">
          {imageUrl && (
            <div className="relative aspect-video overflow-hidden rounded-tile bg-tile">
              <Image
                src={imageUrl}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 940px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}
          <Tile className="min-w-0 p-6 md:p-10">
            <RichText
              data={post.content}
              className="mx-0 w-full max-w-[720px] text-[16px] prose-p:leading-relaxed prose-p:text-soft prose-li:text-soft prose-headings:font-display prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-2xl md:text-[17px]"
            />
          </Tile>
        </div>

        <aside className="flex flex-col gap-3.5 lg:sticky lg:top-4">
          <StatTile label="Час читання" value={`${readingMinutes} хв`} hint={`${words} слів`} />
          <Tile size="sm" className="flex flex-col gap-3 p-5">
            <span className="text-[13px] text-muted-foreground">Поділитися</span>
            <SharePost />
          </Tile>
          {otherPosts.length > 0 && (
            <Tile size="sm" className="flex flex-col gap-3 p-5">
              <span className="text-[13px] text-muted-foreground">Інші пости</span>
              <div className="flex flex-col gap-2">
                {otherPosts.map((other) => {
                  const otherImage = typeof other.image === 'object' ? other.image?.url : null
                  return (
                    <Link
                      key={other.id}
                      href={`/blog/${other.slug}`}
                      className="group flex items-center gap-3 rounded-2xl bg-chip p-2 pr-3 transition-colors hover:bg-chip/60"
                    >
                      {otherImage && (
                        <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={otherImage}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </span>
                      )}
                      <span className="flex min-w-0 flex-col">
                        <span className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
                          {other.title}
                        </span>
                        {other.publishedAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatPostDate(other.publishedAt)}
                          </span>
                        )}
                      </span>
                    </Link>
                  )
                })}
              </div>
              <Link href="/blog" className="text-sm font-semibold text-primary hover:opacity-90">
                Усі пости →
              </Link>
            </Tile>
          )}
        </aside>
      </section>
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

const queryOtherPosts = cache(async ({ excludeId }: { excludeId: string }) => {
  const payload = await getPayload({ config: config })

  const result = await payload.find({
    collection: 'posts',
    limit: 3,
    sort: '-publishedAt',
    overrideAccess: false,
    depth: 1,
    where: { id: { not_equals: excludeId } },
    select: { title: true, slug: true, image: true, publishedAt: true },
  })

  return result.docs
})

export default PostPage
