'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { CollapsibleVolume } from './collapsible-volume'
import { Book, BookChapter } from '@/payload-types'
import { stringify } from 'qs-esm'
import { Skeleton } from './ui/skeleton'
import { Card, CardHeader } from './ui/card'

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
      if (!acc.chapter || typeof acc.chapter === 'string') {
        return { chapter: current, index: idx }
      }
      const dateFallback = new Date()
      if (
        new Date(acc.chapter?.addedAt || dateFallback) > new Date(current?.addedAt || dateFallback)
      )
        return acc
      return { chapter: current, index: idx }
    },
    { chapter: book.chapters?.docs?.[0], index: 0 },
  )
  const lastChapter = lastChapterData?.chapter
  const lastChapterIndex = lastChapterData?.index
  if (isLoading) {
    return (
      <>
        <div className="py-2 flex gap-2 justify-between items-center">
          <div className="space-y-1">
            <div className="text-foreground/70">Останній розділ:</div>
            <Skeleton className="w-[250px] h-6" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {book.volumes?.map((volume, index) => (
            <Card className="gap-0  " key={volume.id}>
              <CardHeader className="cursor-pointer pb-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-muted text-foreground w-8 h-8 rounded-md flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-medium wrap-anywhere animate-pulse ">{volume.name}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </>
    )
  }
  return (
    <>
      <div className="py-2 flex gap-2 justify-between items-center">
        <div className="space-y-1">
          <div className="text-foreground/70">Останній розділ:</div>
          <Link href={`/novel/${book.slug}/${lastChapterIndex}`}>
            {typeof lastChapter === 'string' ? lastChapter : lastChapter?.title}
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {book.volumes?.map((volume, index) => (
          <CollapsibleVolume
            key={volume.id}
            number={index + 1}
            title={volume.name}
            chapters={chapters?.slice(volume.from - 1, volume.to) || []}
            bookSlug={book.slug || ''}
            chapterIndexOffset={volume.from}
          />
        ))}
      </div>
    </>
  )
}

export default Chapters
