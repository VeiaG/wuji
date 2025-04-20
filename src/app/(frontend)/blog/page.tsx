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
    sort: '_order',
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
    <>
      <section className="py-24 relative">
        <div className="bg-gradient-to-bl from-zinc-950 to-zinc-800/50 blur-2xl w-full h-full -z-10 absolute top-0 left-0" />
        <div className="container mx-auto relative">
          <h1 className="text-4xl md:text-6xl font-bold ">Блог</h1>
          <p className="text-lg md:text-xl mt-4">
            Тут будуть новини , оновлення та інша корисна інформація про наш проект та його
            розвиток.
          </p>
        </div>
      </section>
      <section className="container mx-auto pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 py-6">
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
        {posts.totalPages > 1 && <CollectionPagination totalPages={posts.totalPages} />}
      </section>
    </>
  )
}

export default BlogPage
