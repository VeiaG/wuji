'use client'
import { BookChapter } from '@/payload-types'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import Comments from '@/components/comments'
import { useLastReadPageContext } from '@/components/LastReadPageProvider'
import { getInitialSettings, Settings } from '@/globals/settings'
import SettingsOverlay from '@/components/SettingsOverlay'
import TextSelectionPopup from '@/components/text-selection-popup'

export type Props = {
  chapter: BookChapter
  page: number
  bookSlug: string
}

const TextSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Fragment key={index}>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </Fragment>
      ))}
    </div>
  )
}

const ReadClientPage: React.FC<Props> = ({ chapter, page, bookSlug }) => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  const [settings, setSettings] = useState<Settings>(getInitialSettings)
  const { saveLastPage } = useLastReadPageContext()
  const chapterContentRef = useRef<HTMLDivElement>(null)

  const chapterTitle = useMemo(() => {
    if (typeof chapter.book === 'string') return undefined
    return chapter.book.title
  }, [chapter.book])

  useEffect(() => {
    if (!chapterTitle) return
    saveLastPage(bookSlug, page.toString(), chapterTitle)
  }, [chapterTitle, page, bookSlug, saveLastPage])

  useEffect(() => {
    const settings = localStorage.getItem('settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      setSettings((prev) => ({
        ...prev,
        fontSize: parsed.fontSize || 'prose-base',
        fontFamily: parsed.fontFamily || 'font-sans',
      }))
    }
  }, [])
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings))
  }, [settings])

  if (typeof chapter.book === 'string') return null

  return (
    <div className="w-full">
      <div
        className="container mx-auto flex gap-2 justify-between items-center max-w-[800px] py-2 border-b"
        key={`${settings.fontSize}-${settings.fontFamily}`}
      >
        <Link href={`/novel/${bookSlug}`} className="text-lg font-bold flex gap-1 items-center">
          <ChevronLeft className="" />
          {chapter.book.title}
        </Link>
        <div className="flex gap-2 items-center">
          {page > 1 && (
            <Button variant="outline" size="icon" asChild>
              <Link href={`/novel/${bookSlug}/${page - 1}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}

          <Button variant="outline" size="icon" asChild>
            <Link href={`/novel/${bookSlug}/${page + 1}`}>
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-[800px] py-4">
        <h1
          className={cn(
            'text-3xl font-bold mb-2',
            chapter?.isSpoiler
              ? 'blur-sm hover:blur-none transition-all duration-300 text-spoiler'
              : '',
          )}
        >
          {chapter.title}
        </h1>
        {chapter?.isSpoiler && (
          <Badge className="mb-2" variant="outline">
            *Назва може містити спойлери
          </Badge>
        )}
        <div ref={chapterContentRef} data-chapter-content>
          {isClient ? (
            <RichText
              data={chapter.content}
              className={cn(settings.fontSize, settings.fontFamily)}
            />
          ) : (
            <TextSkeleton />
          )}
        </div>
        <Button variant="default" className="mt-4 mx-auto" asChild>
          <Link href={`/novel/${bookSlug}/${page + 1}`}>Наступний розділ</Link>
        </Button>
        <Comments chapterID={chapter?.id} />
      </div>
      {isClient && chapterContentRef.current && (
        <TextSelectionPopup
          chapterId={chapter.id}
          bookId={chapter.book.id}
          pageNumber={page}
          target={chapterContentRef.current}
        />
      )}
      <SettingsOverlay
        settings={settings}
        setSettings={setSettings}
        page={page}
        bookSlug={bookSlug}
        chapterID={chapter.id}
      />
    </div>
  )
}

export default ReadClientPage
