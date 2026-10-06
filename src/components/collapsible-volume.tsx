'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
  const chapterNumber = index + chapterIndexOffset
  const href = `/novel/${bookSlug}/${chapterNumber}`

  return (
    <Link
      href={href}
      className="group flex min-h-[52px] items-center gap-3 rounded-[14px] bg-chip px-4 py-2.5 transition-colors hover:bg-chip/60"
    >
      <span className="shrink-0 font-display text-sm font-bold text-primary tabular-nums">
        {chapterNumber}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            'truncate text-[15px]',
            chapter.isSpoiler && 'blur-sm hover:blur-none transition-all duration-300 text-spoiler',
          )}
        >
          {chapter.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(chapter?.addedAt || new Date()).toLocaleDateString('uk-UA')}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
    </Link>
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
  // Розділи рендеримо лише після першого відкриття — у великих книгах їх тисячі
  const [isRenderChapters, setIsRenderChapters] = useState(defaultExpanded)
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
    <div className="rounded-2xl bg-background/50">
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition-colors hover:bg-chip/50 cursor-pointer"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-chip font-display text-sm font-bold text-primary">
          {number}
        </span>
        <span className="flex-1 font-semibold wrap-anywhere">{title}</span>
        <span className="shrink-0 text-[13px] text-muted-foreground">{stableChapters.length} розд.</span>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-muted-foreground transition-transform',
            isExpanded && 'rotate-180',
          )}
        />
      </button>

      {/* Animated collapsible content */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-2 p-2 pt-1 md:grid-cols-2 xl:grid-cols-3">
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
          </div>
        </div>
      </div>
    </div>
  )
})
