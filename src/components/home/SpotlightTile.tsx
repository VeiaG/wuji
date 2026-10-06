import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { SpotlightBlock } from '@/payload-types'
import { extractPlainText } from '@/lib/extractPlainText'
import { cn } from '@/lib/utils'

// Каскадна поява тексту при завантаженні (лише якщо користувач не вимкнув анімації)
const reveal =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-700'

// Велика плитка «Новинка тижня»: текст ліворуч, обкладинка праворуч.
// Ховер (лише пристрої з курсором): обкладинка повільно наближується з відблиском, на кнопці виїжджає стрілка
export function SpotlightTile({ block, className }: { block: SpotlightBlock; className?: string }) {
  const book = block.book
  if (!book || typeof book === 'string') return null

  const cover = typeof book.coverImage === 'object' ? book.coverImage : null
  const description = block.customDescription || extractPlainText(book.description)
  const author =
    book.origin === 'original'
      ? typeof book.owner === 'object' && book.owner
        ? book.owner.nickname
        : null
      : typeof book.author === 'object' && book.author
        ? book.author.name
        : null
  const genres = (book.genres || [])
    .filter((genre) => typeof genre === 'object' && genre !== null)
    .slice(0, 3)
    .map((genre) => (typeof genre === 'object' ? genre.title : ''))
  const meta = [author, ...genres].filter(Boolean).join(' · ')

  return (
    <Link
      href={`/novel/${book.slug}`}
      className={cn(
        'group flex overflow-hidden rounded-tile bg-tile transition-colors hover:bg-[color-mix(in_srgb,var(--tile)_92%,white)]',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:p-7 md:gap-4 md:p-9">
        <span
          className={cn(
            reveal,
            'text-xs font-bold uppercase tracking-[0.08em] text-primary md:text-[13px]',
          )}
        >
          {block.label || 'Новинка тижня'}
        </span>
        <h2
          className={cn(
            reveal,
            'heading-display text-[clamp(24px,3.6vw,44px)] line-clamp-3 motion-safe:delay-75',
          )}
        >
          {book.title}
        </h2>
        {description && (
          <p
            className={cn(
              reveal,
              'line-clamp-3 text-[15px] leading-[1.55] text-soft md:line-clamp-4 md:text-base motion-safe:delay-150',
            )}
          >
            {description}
          </p>
        )}
        <span className="flex-1" />
        <span
          className={cn(
            reveal,
            'flex flex-wrap items-center gap-x-3 gap-y-2 motion-safe:delay-200',
          )}
        >
          <span className="inline-flex min-h-12 items-center rounded-[14px] bg-primary px-6 text-base font-bold text-primary-foreground transition-[padding] duration-300 group-hover:pr-4">
            {block.buttonLabel || 'Читати'}
            <ArrowRight className="size-4 w-0 -translate-x-2 opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100" />
          </span>
          {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
        </span>
      </div>
      {cover?.url && (
        <span className="relative w-[36%] max-w-[300px] shrink-0 overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-110 motion-safe:duration-1000 sm:w-[clamp(200px,24vw,300px)]">
          <Image
            src={cover.url}
            alt={cover.alt || book.title}
            fill
            sizes="300px"
            priority
            className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.06]"
          />
          {/* Відблиск, що пробігає по обкладинці при наведенні */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:translate-x-full group-hover:opacity-100 group-hover:transition-transform group-hover:duration-1000"
          />
        </span>
      )}
    </Link>
  )
}
