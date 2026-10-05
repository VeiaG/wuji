import { getPayload } from 'payload'
import config from '@payload-config'
import BlogCard from '@/components/PostCard'
import CollectionPagination from '@/components/CollectionPagination'

type BlogPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}
const BlogPage = async ({ searchParams }: BlogPageProps) => {
  const params = await searchParams
  const page = params?.page ? Number(params.page) : 1

  const payload = await getPayload({ config: config })
  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 8,
    sort: '-_order',
    page: page,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      shortDescription: true,
      image: true,
      publishedAt: true,
    },
  })
  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <div className="flex flex-col gap-2">
        <h1 className="heading-display text-[32px] md:text-[44px]">Блог</h1>
        <p className="max-w-[640px] text-[15px] leading-relaxed text-soft md:text-base">
          Новини, оновлення та інша корисна інформація про наш проект та його розвиток.
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {posts.docs.map((post, index) => (
          <BlogCard
            key={index}
            title={post.title}
            description={post.shortDescription}
            image={post.image}
            slug={post?.slug || ''}
            publishedAt={post.publishedAt}
          />
        ))}
      </div>
      {posts.totalPages > 1 && (
        <div className="mt-8">
          <CollectionPagination totalPages={posts.totalPages} />
        </div>
      )}
    </div>
  )
}

export default BlogPage
