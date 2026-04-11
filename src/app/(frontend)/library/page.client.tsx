'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Heart, BookMarked } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ProgressCard, BookmarkCard } from '@/components/library-cards'
import { useAuth } from '@/providers/auth'
import { stringify } from 'qs-esm'
import type { ReadProgress, Bookmark } from '@/payload-types'

type Tab = 'progress' | 'bookmarks'

export function LibraryClientPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('progress')
  const [readProgresses, setReadProgresses] = useState<ReadProgress[] | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchProgress = async () => {
      const qs = stringify({
        where: { user: { equals: user.id } },
        sort: '-updatedAt',
        limit: 50,
        depth: 2,
      })
      const res = await fetch(`/api/readProgress?${qs}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setReadProgresses(data.docs ?? [])
      }
    }

    const fetchBookmarks = async () => {
      const qs = stringify({
        where: { user: { equals: user.id } },
        sort: '-createdAt',
        limit: 50,
        depth: 2,
      })
      const res = await fetch(`/api/bookmarks?${qs}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setBookmarks(data.docs ?? [])
      }
    }

    Promise.all([fetchProgress(), fetchBookmarks()]).finally(() => setIsLoading(false))
  }, [user])

  const handleRemoveProgress = (id: string) =>
    setReadProgresses((prev) => prev?.filter((p) => p.id !== id) ?? null)

  const handleRemoveBookmark = (id: string) =>
    setBookmarks((prev) => prev?.filter((b) => b.id !== id) ?? null)

  if (!user && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">Увійдіть щоб бачити свою бібліотеку</p>
        <Button asChild>
          <Link href="/login">Увійти</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Бібліотека</h1>
      </div>

      {/* Tabs */}
      <div className="border-b px-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('progress')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
              activeTab === 'progress'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <BookMarked className="h-4 w-4" />
            Читаю
            {readProgresses && readProgresses.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {readProgresses.length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
              activeTab === 'bookmarks'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Heart className="h-4 w-4" />
            Закладки
            {bookmarks && bookmarks.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {bookmarks.length}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : activeTab === 'progress' ? (
          readProgresses && readProgresses.length > 0 ? (
            <div className="space-y-3">
              {readProgresses.map((progress) => (
                <ProgressCard
                  key={progress.id}
                  progressID={progress.id}
                  book={progress.book}
                  page={progress.chapter ?? 0}
                  updatedAt={progress.updatedAt}
                  onRemove={handleRemoveProgress}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-10 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <CardTitle className="text-lg mb-2">Почніть читати</CardTitle>
                <CardDescription className="mb-4">
                  Ваш прогрес читання з&apos;явиться тут
                </CardDescription>
                <Button asChild>
                  <Link href="/novels">Каталог</Link>
                </Button>
              </CardContent>
            </Card>
          )
        ) : bookmarks && bookmarks.length > 0 ? (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onRemove={handleRemoveBookmark}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <CardTitle className="text-lg mb-2">Немає закладок</CardTitle>
              <CardDescription className="mb-4">
                Додайте книги до закладок щоб знайти їх тут
              </CardDescription>
              <Button asChild>
                <Link href="/novels">Каталог</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
