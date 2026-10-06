import { getPayload } from 'payload'
import config from '@payload-config'
import BlogCard from '@/components/PostCard'
import CollectionPagination from '@/components/CollectionPagination'
import { cn } from '@/lib/utils'

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
    limit: 7,
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
  const featured = page === 1 ? posts.docs[0] : undefined
  const rest = featured ? posts.docs.slice(1) : posts.docs

  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <div className="flex flex-col gap-2">
        <h1 className="heading-display text-[32px] md:text-[44px]">Блог</h1>
        <p className="max-w-[640px] text-[15px] leading-relaxed text-soft md:text-base">
          Новини, оновлення та інша корисна інформація про наш проект та його розвиток.
        </p>
      </div>
      {/* На першій сторінці найсвіжіший пост — великою плиткою */}
      {featured && (
        <BlogCard
          featured
          className="mt-4"
          title={featured.title}
          description={featured.shortDescription}
          image={featured.image}
          slug={featured.slug || ''}
          publishedAt={featured.publishedAt}
        />
      )}
      {rest.length > 0 && (
        <div
          className={cn(
            'grid grid-cols-1 gap-3.5 md:grid-cols-2',
            // 1, 2 або 4 пости рівніше лягають у дві колонки, ніж лишають «сироту» в третій
            [1, 2, 4].includes(rest.length) ? 'lg:grid-cols-2' : 'lg:grid-cols-3',
            !featured && 'mt-4',
          )}
        >
          {rest.map((post) => (
            <BlogCard
              key={post.id}
              title={post.title}
              description={post.shortDescription}
              image={post.image}
              slug={post?.slug || ''}
              publishedAt={post.publishedAt}
            />
          ))}
        </div>
      )}
      {posts.totalPages > 1 && (
        <div className="mt-8">
          <CollectionPagination totalPages={posts.totalPages} />
        </div>
      )}
    </div>
  )
}

export default BlogPage
