'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Play, Trash2, ChevronRight } from 'lucide-react'
import ConfirmDialog from '@/components/confirm-dialog'
import { ProgressBar } from '@/components/bento'
import type { ReadProgress, Bookmark, Media } from '@/payload-types'
import { cn } from '@/lib/utils'

const formatDate = (date: string) => new Date(date).toLocaleDateString('uk-UA')

const RowCover = ({ cover, title }: { cover: string | Media | null | undefined; title: string }) =>
  typeof cover === 'object' && cover?.url ? (
    <Image
      src={cover.url}
      alt={cover.alt || title}
      width={64}
      height={96}
      className="h-24 w-16 shrink-0 rounded-xl object-cover"
    />
  ) : (
    <span className="grid h-24 w-16 shrink-0 place-items-center rounded-xl bg-chip font-display text-xl font-extrabold text-muted-foreground">
      {title.charAt(0)}
    </span>
  )

const iconButton =
  'grid size-11 shrink-0 place-items-center rounded-[14px] transition-colors cursor-pointer'

export const ProgressCard = ({
  book,
  page,
  updatedAt,
  progressID,
  onRemove,
  className,
}: {
  book: ReadProgress['book']
  page: number
  updatedAt?: string
  progressID: string
  onRemove?: (readProgressId: string) => void
  className?: string
}) => {
  if (!book || typeof book === 'string') return null

  const totalPages = book.chapterCount || 1
  const progressPercentage = Math.min((page / totalPages) * 100, 100)

  const handleRemove = async () => {
    try {
      const res = await fetch(`/api/readProgress/${progressID}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) onRemove?.(progressID)
    } catch (error) {
      console.error('Error removing read progress:', error)
    }
  }

  return (
    <div className={cn('flex items-center gap-4 rounded-tile-sm bg-tile p-3.5', className)}>
      <Link href={`/novel/${book.slug}`} className="shrink-0" tabIndex={-1} aria-hidden>
        <RowCover cover={book.coverImage} title={book.title} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Link href={`/novel/${book.slug}`} className="line-clamp-2 font-bold leading-snug hover:text-primary">
          {book.title}
        </Link>
        <span className="text-[13px] text-muted-foreground">
          Розділ {page} з {totalPages}
          {updatedAt && <> · оновлено {formatDate(updatedAt)}</>}
        </span>
        <ProgressBar value={progressPercentage} />
      </div>
      <span className="hidden w-16 text-right font-display text-[22px] font-extrabold sm:block">
        {Math.round(progressPercentage)}%
      </span>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Link
          href={`/novel/${book.slug}/${page}`}
          aria-label={`Продовжити ${book.title}`}
          className={cn(iconButton, 'bg-primary text-primary-foreground hover:bg-primary/90')}
        >
          <Play className="size-4 fill-current" />
        </Link>
        {onRemove && (
          <ConfirmDialog
            trigger={
              <button
                type="button"
                className={cn(iconButton, 'bg-chip text-muted-foreground hover:text-foreground')}
                aria-label={`Видалити прогрес для ${book.title}`}
              >
                <Trash2 className="size-4" />
              </button>
            }
            onConfirm={handleRemove}
            title="Видалити прогрес читання"
            description={`Видалити прогрес для "${book.title}"? Цю дію не можна скасувати.`}
          />
        )}
      </div>
    </div>
  )
}

export const BookmarkCard = ({
  bookmark,
  onRemove,
  className,
}: {
  bookmark: Bookmark
  onRemove?: (bookmarkId: string) => void
  className?: string
}) => {
  if (!bookmark.book || typeof bookmark.book === 'string') return null
  const book = bookmark.book

  const handleRemove = async () => {
    if (!onRemove) return
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) onRemove(bookmark.id)
    } catch (error) {
      console.error('Error removing bookmark:', error)
    }
  }

  const genres = (book.genres || [])
    .filter((genre) => typeof genre === 'object' && genre !== null)
    .slice(0, 2)
    .map((genre) => (typeof genre === 'object' ? genre.title : ''))

  return (
    <div className={cn('flex items-center gap-4 rounded-tile-sm bg-tile p-3.5', className)}>
      <Link href={`/novel/${book.slug}`} className="shrink-0" tabIndex={-1} aria-hidden>
        <RowCover cover={book.coverImage} title={book.title} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Link href={`/novel/${book.slug}`} className="line-clamp-2 font-bold leading-snug hover:text-primary">
          {book.title}
        </Link>
        <span className="text-[13px] text-muted-foreground">
          {genres.length > 0 && <>{genres.join(' · ')} · </>}додано {formatDate(bookmark.createdAt)}
        </span>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Link
          href={`/novel/${book.slug}`}
          aria-label={`Відкрити ${book.title}`}
          className={cn(iconButton, 'bg-chip text-foreground hover:bg-chip/70')}
        >
          <ChevronRight className="size-5" />
        </Link>
        {onRemove && (
          <button
            type="button"
            className={cn(iconButton, 'bg-chip text-muted-foreground hover:text-foreground')}
            onClick={handleRemove}
            aria-label={`Видалити закладку для ${book.title}`}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
