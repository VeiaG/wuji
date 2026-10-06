import { Media } from '@/payload-types'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type BlogCardProps = {
  title: string
  description: string
  image: string | Media
  slug: string
  publishedAt: string
  hideImage?: boolean
  className?: string
  /** Велика плитка для найсвіжішого поста (текст ліворуч, зображення праворуч) */
  featured?: boolean
}

export const formatPostDate = (date: string) =>
  new Date(date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })

const BlogCard = ({
  title,
  description,
  image,
  slug,
  publishedAt,
  hideImage = false,
  className,
  featured = false,
}: BlogCardProps) => {
  const imageUrl = typeof image === 'string' ? image : image?.url
  const alt = (image as Media)?.alt || title

  if (featured) {
    return (
      <Link
        href={`/blog/${slug}`}
        className={cn(
          'group grid overflow-hidden rounded-tile bg-tile transition-colors hover:bg-[color-mix(in_srgb,var(--tile)_92%,white)] md:grid-cols-[1fr_1.15fr]',
          className,
        )}
      >
        <span className="order-2 flex flex-col gap-4 p-6 md:order-1 md:p-9">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-primary md:text-[13px]">
              Новий пост
            </span>
            <span className="text-[13px] text-muted-foreground">· {formatPostDate(publishedAt)}</span>
          </span>
          <span className="heading-display text-[clamp(26px,3.4vw,40px)]">{title}</span>
          {description && (
            <span className="line-clamp-4 text-[15px] leading-relaxed text-soft md:text-base">
              {description}
            </span>
          )}
          <span className="flex-1" />
          <span className="inline-flex min-h-12 w-fit items-center gap-2 rounded-[14px] bg-primary px-6 font-bold text-primary-foreground">
            Читати <ArrowUpRight className="size-4" />
          </span>
        </span>
        {!hideImage && imageUrl && (
          <span className="relative order-1 block aspect-video md:order-2 md:aspect-auto md:min-h-[360px]">
            <Image
              src={imageUrl}
              alt={alt}
              fill
              priority
              sizes="(min-width: 768px) 640px, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </span>
        )}
      </Link>
    )
  }

  // Звичайна плитка: зображення вписане в плитку з відступом
  return (
    <Link
      href={`/blog/${slug}`}
      className={cn(
        'group flex flex-col gap-4 rounded-tile-sm bg-tile p-3 pb-5 transition-colors hover:bg-chip',
        className,
      )}
    >
      {!hideImage && imageUrl && (
        <span className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-chip">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 400px, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </span>
      )}
      <span className="flex flex-1 flex-col gap-2 px-2">
        <span className="text-[13px] text-muted-foreground">{formatPostDate(publishedAt)}</span>
        <span className="font-display text-lg font-bold leading-snug tracking-[-0.01em] line-clamp-2">
          {title}
        </span>
        {description && (
          <span className="line-clamp-3 text-[15px] leading-relaxed text-soft">{description}</span>
        )}
        <span className="mt-auto flex items-center justify-between pt-2 text-sm font-semibold text-primary">
          Прочитати
          <span className="grid size-9 place-items-center rounded-xl bg-chip text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowUpRight className="size-4" />
          </span>
        </span>
      </span>
    </Link>
  )
}

export default BlogCard
