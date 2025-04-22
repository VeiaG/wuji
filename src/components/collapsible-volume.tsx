'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
// import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { BookChapter } from '@/payload-types'

interface VolumeProps {
  number: number
  title: string
  chapters: (string | BookChapter)[]
  bookSlug: string
  defaultExpanded?: boolean
  chapterIndexOffset?: number
}

const ChapterLink = memo(function ChapterLink({
  chapter,
  index,
  chapterIndexOffset,
  bookSlug,
}: {
  chapter: BookChapter
  index: number
  chapterIndexOffset: number
  bookSlug: string
}) {
  const href = `/novel/${bookSlug}/${index + chapterIndexOffset}`
  return (
    <div key={chapter.id} className="relative">
      <Link href={href}>
        <div className="group flex items-center justify-between gap-2 p-4 hover:bg-muted transition-colors border-b">
          <div className="flex-1 relative max-w-[calc(100%-48px)]">
            <div
              className={cn(
                'font-medium truncate text-nowrap max-w-full',
                chapter.isSpoiler
                  ? 'blur-sm hover:blur-none transition-all duration-300 text-spoiler'
                  : '',
              )}
            >
              {chapter.title}
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(chapter?.addedAt || new Date()).toLocaleDateString('uk-UA')}
            </div>
          </div>
          <div className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>
      </Link>
    </div>
  )
})

export const CollapsibleVolume = memo(function CollapsibleVolume({
  number,
  title,
  chapters,
  bookSlug,
  defaultExpanded = false,
  chapterIndexOffset = 0,
}: VolumeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const stableChapters = useMemo(() => chapters ?? [], [chapters])
  const [isRenderChapters, setIsRenderChapters] = useState(false)
  const [isAlreadyExpanded, setIsAlreadyExpanded] = useState(false)

  const toggleExpanded = () => {
    if (isRenderChapters) {
      setIsExpanded((prev) => !prev)
    } else {
      setIsRenderChapters(true)
      setIsAlreadyExpanded(true)
    }
  }
  useEffect(() => {
    if (isRenderChapters && isAlreadyExpanded) {
      setIsExpanded(true)
      setIsAlreadyExpanded(false)
    }
  }, [isExpanded, isAlreadyExpanded, isRenderChapters])

  return (
    <Card className="gap-0">
      <CardHeader className="cursor-pointer pb-0" onClick={toggleExpanded}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-muted text-foreground w-8 h-8 rounded-md flex items-center justify-center">
              {number}
            </span>
            <span className="font-medium truncate  text-nowrap">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {/* Animated collapsible content */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="py-0 bg-muted/20 grid gap-x-2 grid-cols-1 xl:grid-cols-2 ">
            {isRenderChapters &&
              stableChapters.map((chapter, index) => {
                if (typeof chapter === 'string') {
                  return <div key={chapter}>err , chapter object is string</div>
                }
                return (
                  <ChapterLink
                    key={chapter.id}
                    chapter={chapter}
                    index={index}
                    chapterIndexOffset={chapterIndexOffset}
                    bookSlug={bookSlug}
                  />
                )
              })}
          </CardContent>
        </div>
      </div>
    </Card>
  )
})
