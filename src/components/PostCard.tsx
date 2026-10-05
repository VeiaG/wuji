import { Media } from '@/payload-types'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type BlogCardProps = {
  title: string
  description: string
  image: string | Media
  slug: string
  publishedAt: string
  hideImage?: boolean
  className?: string
}

// Плитка поста: зображення 16:9 зверху, дата, заголовок, короткий опис
const BlogCard = ({
  title,
  description,
  image,
  slug,
  publishedAt,
  hideImage = false,
  className,
}: BlogCardProps) => {
  const imageUrl = typeof image === 'string' ? image : image?.url

  return (
    <Link
      href={`/blog/${slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-tile-sm bg-tile transition-colors hover:bg-chip',
        className,
      )}
    >
      {!hideImage && imageUrl && (
        <span className="relative block aspect-video w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={(image as Media)?.alt || title}
            fill
            sizes="(min-width: 1024px) 400px, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </span>
      )}
      <span className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-[13px] text-muted-foreground">
          {new Date(publishedAt).toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <span className="line-clamp-2 text-lg font-bold leading-snug">{title}</span>
        {description && (
          <span className="line-clamp-3 text-[15px] leading-relaxed text-soft">{description}</span>
        )}
        <span className="mt-auto pt-2 text-sm font-semibold text-primary">Прочитати →</span>
      </span>
    </Link>
  )
}

export default BlogCard
