'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { CollapsibleVolume } from './collapsible-volume'
import { Book, BookChapter } from '@/payload-types'
import { stringify } from 'qs-esm'
import { Skeleton } from './ui/skeleton'

const Chapters = ({ book }: { book: Book }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [chapters, setChapters] = useState<BookChapter[]>([])
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const query = stringify({
          where: { 'book.slug': { equals: book.slug || '' } },
          select: {
            title: true,
            isSpoiler: true,
            addedAt: true,
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
  }, [book.slug])

  //find last chapter
  const lastChapterData = chapters?.reduce(
    (acc, current, idx) => {
      if (typeof current === 'string') return acc
      // Індекси розділів у URL 1-based
      if (!acc.chapter || typeof acc.chapter === 'string') {
        return { chapter: current, index: idx + 1 }
      }
      const dateFallback = new Date()
      if (
        new Date(acc.chapter?.addedAt || dateFallback) > new Date(current?.addedAt || dateFallback)
      )
        return acc
      return { chapter: current, index: idx + 1 }
    },
    { chapter: book.chapters?.docs?.[0], index: 1 },
  )
  const lastChapter = lastChapterData?.chapter
  const lastChapterIndex = lastChapterData?.index
  const volumeList = (
    <div className="flex flex-col gap-2">
      {book.volumes?.map((volume, index) =>
        isLoading ? (
          <div key={volume.id} className="flex min-h-14 items-center gap-3 rounded-2xl bg-chip px-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background font-display text-sm font-bold text-primary">
              {index + 1}
            </span>
            <span className="animate-pulse font-semibold">{volume.name}</span>
          </div>
        ) : (
          <CollapsibleVolume
            key={volume.id}
            number={index + 1}
            title={volume.name}
            chapters={chapters?.slice(volume.from - 1, volume.to) || []}
            bookSlug={book.slug || ''}
            chapterIndexOffset={volume.from}
            defaultExpanded={book.volumes?.length === 1}
          />
        ),
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
        <span className="text-muted-foreground">Останній розділ:</span>
        {isLoading ? (
          <Skeleton className="h-5 w-[220px]" />
        ) : (
          lastChapter && (
            <Link
              href={`/novel/${book.slug}/${lastChapterIndex}`}
              className="font-semibold text-primary hover:opacity-90"
            >
              {typeof lastChapter === 'string' ? lastChapter : lastChapter?.title}
            </Link>
          )
        )}
      </div>
      {volumeList}
    </div>
  )
}

export default Chapters
