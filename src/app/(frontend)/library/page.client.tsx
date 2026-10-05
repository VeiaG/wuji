'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tile } from '@/components/bento'
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
    if (user === undefined) return // ще завантажується auth
    if (user === null) { setIsLoading(false); return }

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
      <div className="container-page pt-2">
        <Tile className="mx-auto flex max-w-lg flex-col items-center gap-4 p-10 text-center">
          <h1 className="heading-display text-2xl">Бібліотека</h1>
          <p className="text-muted-foreground">Увійдіть, щоб бачити свій прогрес і закладки.</p>
          <Button asChild size="lg">
            <Link href="/login">Увійти</Link>
          </Button>
        </Tile>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'progress', label: 'Читаю', count: readProgresses?.length },
    { id: 'bookmarks', label: 'Закладки', count: bookmarks?.length },
  ]

  const empty = (title: string, text: string) => (
    <div className="flex flex-col items-center gap-3 rounded-tile bg-tile px-6 py-12 text-center">
      <span className="heading-display text-xl">{title}</span>
      <span className="max-w-sm text-[15px] text-muted-foreground">{text}</span>
      <Button asChild className="mt-1">
        <Link href="/novels">До каталогу</Link>
      </Button>
    </div>
  )

  return (
    <div className="container-page flex flex-col gap-4 pt-2">
      <h1 className="heading-display text-[32px]">Бібліотека</h1>

      <div role="tablist" className="inline-flex gap-1 self-start rounded-2xl bg-tile p-[5px]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex min-h-[42px] items-center gap-2 rounded-xl px-5 text-[15px] font-bold transition-colors cursor-pointer',
              activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-soft hover:text-foreground',
            )}
          >
            {tab.label}
            {!!tab.count && <span className="text-[13px] opacity-70">{tab.count}</span>}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[124px] rounded-tile-sm" />
          ))}
        </div>
      ) : activeTab === 'progress' ? (
        readProgresses && readProgresses.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
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
          empty('Почніть читати', "Ваш прогрес читання з'явиться тут")
        )
      ) : bookmarks && bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {bookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} onRemove={handleRemoveBookmark} />
          ))}
        </div>
      ) : (
        empty('Немає закладок', 'Додайте книги до закладок, щоб знайти їх тут')
      )}
    </div>
  )
}
