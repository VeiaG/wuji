'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { stringify } from 'qs-esm'
import { useVirtualizer } from '@tanstack/react-virtual'
import { BookChapter } from '@/payload-types'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

/**
 * Віртуалізований список розділів. Живе окремим компонентом, який монтується
 * заново при кожному відкритті sheet — віртуалізатор завжди отримує свіжий
 * скрол-елемент. Якщо тримати useVirtualizer у батьківському компоненті,
 * після закриття sheet скрол-елемент розмонтовується, і при повторному
 * відкритті віртуалізатор працює із застарілим вимірюванням (порожній список).
 */
const VirtualChapterList: React.FC<{
  chapters: BookChapter[]
  bookSlug: string
  page: number
}> = ({ chapters, bookSlug, page }) => {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: chapters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  })

  // Скрол до поточного розділу при монтуванні (= при кожному відкритті sheet)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      rowVirtualizer.scrollToIndex(page - 1, { align: 'center' })
    })
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={parentRef} className="flex-1 min-h-0 overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <Link
              href={`/novel/${bookSlug}/${virtualRow.index + 1}`}
              className={cn('w-full flex items-center px-4 hover:bg-muted h-16', {
                'bg-secondary': page === virtualRow.index + 1,
              })}
            >
              <span
                className={cn(
                  'line-clamp-2',
                  chapters[virtualRow.index]?.isSpoiler
                    ? 'blur-sm hover:blur-none transition-all duration-300 text-spoiler'
                    : '',
                )}
              >
                {chapters[virtualRow.index]?.title}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Sheet зі списком розділів книги. Розділи фетчаться ліниво — при першому
 * відкритті. Тригер передається через children (SheetTrigger asChild).
 */
const ChapterListSheet: React.FC<{
  bookSlug: string
  page: number
  children: React.ReactNode
  contentClassName?: string
  overlayClassName?: string
  onOpenChange?: (open: boolean) => void
}> = ({ bookSlug, page, children, contentClassName, overlayClassName, onOpenChange }) => {
  const [chapters, setChapters] = useState<BookChapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetch, setIsFetch] = useState(false) // Фетчимо тільки під час першого відкриття списку
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    if (!isFetch) return
    const fetchChapters = async () => {
      try {
        const query = stringify({
          where: { 'book.slug': { equals: bookSlug } },
          select: {
            title: true,
            isSpoiler: true,
          },
          //sort by internal join field order
          sort: '_bookChapters_chapters_order',
          limit: 0,
        })
        const req = await fetch(`/api/bookChapters?${query}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await req.json()
        if (data && data?.docs) {
          setChapters(data?.docs)
        }
      } catch (err) {
        console.log(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchChapters()
  }, [bookSlug, isFetch])

  const handleOpenChange = (open: boolean) => {
    setIsSheetOpen(open)
    if (open) setIsFetch(true)
    onOpenChange?.(open)
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="left"
        className={cn('flex flex-col', contentClassName)}
        overlayClassName={overlayClassName}
      >
        <SheetHeader>
          <SheetTitle>Розділи</SheetTitle>
          <SheetDescription className="hidden">Список усіх розділів</SheetDescription>
        </SheetHeader>

        {!isLoading && chapters.length > 0 ? (
          <VirtualChapterList chapters={chapters} bookSlug={bookSlug} page={page} />
        ) : (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="h-full w-full mx-4" />
            ) : (
              <div className="text-muted-foreground">Не знайдено розділу</div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default ChapterListSheet
