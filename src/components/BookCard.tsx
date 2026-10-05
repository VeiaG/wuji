import { BookGenre, Media } from '@/payload-types'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// Обкладинка без картки: зображення 2:3, під ним назва й жанри рядком
export const BookCard: React.FC<{
  book: {
    id: string
    title: string
    coverImage: string | Media
    genres: (string | BookGenre)[]
    slug?: string | null | undefined
  }
  className?: string
  /** Додатковий вміст поверх обкладинки (бейджі тощо) */
  overlay?: React.ReactNode
}> = ({ book, className, overlay }) => {
  const genres = (book.genres || [])
    .filter((genre): genre is BookGenre => typeof genre === 'object' && genre !== null)
    .slice(0, 2)
    .map((genre) => genre.title)

  return (
    <Link href={`/novel/${book.slug}`} className={cn('group flex flex-col gap-3', className)}>
      <span className="relative block aspect-[2/3] w-full overflow-hidden rounded-2xl bg-tile">
        {typeof book.coverImage === 'object' && book.coverImage?.url && (
          <Image
            src={book.coverImage.url}
            alt={book.coverImage.alt || book.title}
            fill
            sizes="(min-width: 1280px) 200px, (min-width: 768px) 25vw, 45vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        {overlay}
      </span>
      <span className="flex flex-col gap-1">
        <span className="line-clamp-2 text-[15px] font-bold leading-tight md:text-base">
          {book.title}
        </span>
        {genres.length > 0 && (
          <span className="truncate text-[13px] text-muted-foreground">{genres.join(' · ')}</span>
        )}
      </span>
    </Link>
  )
}
