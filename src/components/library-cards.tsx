'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import ConfirmDialog from '@/components/confirm-dialog'
import type { ReadProgress, Bookmark } from '@/payload-types'

export const ProgressCard = ({
  book,
  page,
  updatedAt,
  progressID,
  onRemove,
}: {
  book: ReadProgress['book']
  page: number
  updatedAt?: string
  progressID: string
  onRemove: (readProgressId: string) => void
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
      if (res.ok) onRemove(progressID)
    } catch (error) {
      console.error('Error removing read progress:', error)
    }
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {typeof book.coverImage === 'object' && (
            <div className="relative flex-shrink-0">
              <Image
                src={book.coverImage?.url || ''}
                alt={book.coverImage?.alt || book.title}
                width={80}
                height={120}
                className="rounded-md object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link
              className="font-semibold text-sm line-clamp-2 mb-2 hover:underline"
              href={`/novel/${book.slug}`}
            >
              {book.title}
            </Link>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Розділ {page} з {totalPages}
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-1.5" />
              {updatedAt && (
                <div className="text-xs text-muted-foreground">
                  Оновлено {new Date(updatedAt).toLocaleDateString('uk-UA')}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="grow" asChild>
                  <Link href={`/novel/${book.slug}/${page}`}>Продовжити</Link>
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="outline" className="px-2">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  }
                  onConfirm={handleRemove}
                  title="Видалити прогрес читання"
                  description={`Видалити прогрес для "${book.title}"? Цю дію не можна скасувати.`}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const BookmarkCard = ({
  bookmark,
  onRemove,
}: {
  bookmark: Bookmark
  onRemove?: (bookmarkId: string) => void
}) => {
  if (!bookmark.book || typeof bookmark.book === 'string') return null

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

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {typeof bookmark.book.coverImage === 'object' && (
            <div className="relative flex-shrink-0">
              <Image
                src={bookmark.book.coverImage?.url || ''}
                alt={bookmark.book.coverImage?.alt || bookmark.book.title}
                width={80}
                height={120}
                className="rounded-md object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link
              className="font-semibold text-sm line-clamp-2 mb-2 hover:underline"
              href={`/novel/${bookmark.book.slug}`}
            >
              {bookmark.book.title}
            </Link>
            <div className="space-y-2">
              {bookmark.book.genres && Array.isArray(bookmark.book.genres) && (
                <div className="flex flex-wrap gap-1">
                  {bookmark.book.genres.slice(0, 2).map(
                    (genre) =>
                      typeof genre === 'object' && (
                        <Badge key={genre.id} variant="secondary" className="text-xs">
                          {genre.title}
                        </Badge>
                      ),
                  )}
                  {bookmark.book.genres.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{bookmark.book.genres.length - 2}
                    </span>
                  )}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Додано {new Date(bookmark.createdAt).toLocaleDateString('uk-UA')}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-8" asChild>
                  <Link href={`/novel/${bookmark.book.slug}`}>Читати</Link>
                </Button>
                {onRemove && (
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={handleRemove}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
