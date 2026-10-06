import Image from 'next/image'
import Link from 'next/link'
import { FeaturedBookBlock } from '@/payload-types'
import { extractPlainText } from '@/lib/extractPlainText'

// Той самий вигляд, що й SpotlightTile на головній: текст ліворуч, обкладинка праворуч
const FeaturedBookBlockComponent: React.FC<FeaturedBookBlock> = ({
  label,
  book,
  customDescription,
  buttonLabel,
}) => {
  if (!book || typeof book === 'string') return null

  const cover = typeof book.coverImage === 'object' ? book.coverImage : null
  const description = customDescription || extractPlainText(book.description)
  const genres = (book.genres || [])
    .slice(0, 3)
    .map((genre) => (typeof genre === 'object' && genre ? genre.title : null))
    .filter(Boolean)

  return (
    <section className="container-page">
      <Link
        href={`/novel/${book.slug}`}
        className="group flex min-h-[260px] overflow-hidden rounded-tile bg-tile transition-colors hover:bg-[color-mix(in_srgb,var(--tile)_92%,white)] lg:min-h-[380px]"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:p-7 md:gap-4 md:p-9">
          {label && (
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-primary md:text-[13px]">
              {label}
            </span>
          )}
          <h2 className="heading-display line-clamp-3 text-[clamp(24px,3.6vw,44px)]">{book.title}</h2>
          {description && (
            <p className="line-clamp-3 text-[15px] leading-[1.55] text-soft md:line-clamp-4 md:text-base">
              {description}
            </p>
          )}
          <span className="flex-1" />
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex min-h-12 items-center rounded-[14px] bg-primary px-6 text-base font-bold text-primary-foreground">
              {buttonLabel || 'Читати'}
            </span>
            {genres.length > 0 && (
              <span className="text-sm text-muted-foreground">{genres.join(' · ')}</span>
            )}
          </span>
        </div>
        {cover?.url && (
          <span className="relative w-[36%] max-w-[300px] shrink-0 sm:w-[clamp(200px,24vw,300px)]">
            <Image src={cover.url} alt={cover.alt || book.title} fill sizes="300px" className="object-cover" />
          </span>
        )}
      </Link>
    </section>
  )
}

export default FeaturedBookBlockComponent
