'use client'
import { BookChapter } from '@/payload-types'
import RichText from '@/components/RichText'
import PaginatedReader from '@/components/PaginatedReader'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import Comments from '@/components/comments'
import { useReadProgressContext } from '@/components/ReadProgressProvider'
import { defaultSettings, getInitialSettings, Settings } from '@/globals/settings'
import TextSelectionPopup from '@/components/text-selection-popup'
import { ReaderPanel } from '@/components/reader/ReaderPanel'
import { ReaderEndTiles, ReaderHeader, ReaderProgressBar } from '@/components/reader/ReaderChrome'

export type Props = {
  chapter: BookChapter
  page: number
  bookSlug: string
  hasNextChapter: boolean
  totalChapters: number
  disableSaving?: boolean
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

/** Частка прочитаного розділу (0..1) за позицією прокрутки відносно тексту */
const useChapterScrollProgress = (ref: React.RefObject<HTMLDivElement | null>, enabled: boolean) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let frame = 0
    const update = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight * 0.5
      const read = window.innerHeight * 0.5 - rect.top
      setProgress(total > 0 ? Math.min(1, Math.max(0, read / total)) : 1)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [ref, enabled])

  return progress
}

const ReadClientPage: React.FC<Props> = ({
  chapter,
  page,
  bookSlug,
  hasNextChapter,
  totalChapters,
  disableSaving,
}) => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const { saveProgress } = useReadProgressContext()
  const chapterContentRef = useRef<HTMLDivElement>(null)

  const chapterTitle = useMemo(() => {
    if (typeof chapter.book === 'string') return undefined
    return chapter.book.title
  }, [chapter.book])

  const bookId = useMemo(() => {
    if (typeof chapter.book === 'string') return undefined
    return chapter.book.id
  }, [chapter.book])

  useEffect(() => {
    if (!chapterTitle || !bookId || disableSaving) return
    saveProgress(bookId, bookSlug, page, chapterTitle)
  }, [bookId, bookSlug, page, chapterTitle, saveProgress, disableSaving])

  // Налаштування з localStorage (на сервері — значення за замовчуванням)
  useEffect(() => {
    setSettings(getInitialSettings())
  }, [])

  // Зберігаємо лише зміни користувача — інакше дефолти на маунті затирали б збережене
  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      try {
        localStorage.setItem('settings', JSON.stringify(next))
      } catch {
        // localStorage недоступний — налаштування діють лише до перезавантаження
      }
      return next
    })
  }, [])

  const [isOverlayHidden, setIsOverlayHidden] = useState(false)
  const isPaginated = isClient && settings.readingMode === 'paginated'
  const chapterProgress = useChapterScrollProgress(chapterContentRef, isClient && !isPaginated)

  if (typeof chapter.book === 'string') return null

  if (isPaginated) {
    /* ── Paginated / zen mode ─────────────────────────────────────────── */
    return (
      <div
        data-reader-bg={settings.readerBackground}
        className="fixed inset-0 z-[200] overflow-hidden bg-background text-foreground"
      >
        <PaginatedReader
          key={chapter.id}
          data={chapter.content}
          settings={settings}
          onSettingsChange={updateSettings}
          bookSlug={bookSlug}
          chapterID={chapter.id}
          chapterPage={page}
          hasNextChapter={hasNextChapter}
          chapterTitle={chapter.title}
          isSpoilerTitle={chapter.isSpoiler ?? false}
        />
      </div>
    )
  }

  /* ── Scroll mode ──────────────────────────────────────────────────── */
  return (
    <>
      <div
        data-reader-bg={settings.readerBackground}
        className="min-h-screen w-full bg-background pb-28 text-foreground"
      >
        <ReaderProgressBar value={chapterProgress} />
        <ReaderHeader
          bookSlug={bookSlug}
          bookTitle={chapter.book.title}
          page={page}
          totalChapters={totalChapters}
        />

        <main className="mx-auto w-full max-w-[760px] px-4 pt-4 md:pt-8">
          <div className="mb-8 flex flex-col gap-2">
            <span className="text-sm font-semibold text-muted-foreground">Розділ {page}</span>
            <h1
              className={cn(
                'heading-display text-[clamp(24px,3.4vw,36px)]',
                chapter?.isSpoiler && 'blur-sm hover:blur-none transition-all duration-300 text-spoiler',
              )}
            >
              {chapter.title}
            </h1>
            {chapter?.isSpoiler && (
              <span className="text-[13px] text-muted-foreground">*Назва може містити спойлери</span>
            )}
          </div>

          <div ref={chapterContentRef} data-chapter-content>
            {isClient ? (
              <RichText data={chapter.content} className={cn(settings.fontSize, settings.fontFamily)} />
            ) : (
              <TextSkeleton />
            )}
          </div>

          <ReaderEndTiles
            bookSlug={bookSlug}
            page={page}
            hasNextChapter={hasNextChapter}
          />

          <div id="comments" className="scroll-mt-6 pt-10">
            <Comments chapterID={chapter?.id} />
          </div>
        </main>
      </div>

      {/* Поза data-reader-bg — пігулка лишається темною, як і панель */}
      {isClient && chapterContentRef.current && (
        <TextSelectionPopup
          chapterId={chapter.id}
          bookId={chapter.book.id}
          pageNumber={page}
          target={chapterContentRef.current}
          isOverlayHidden={isOverlayHidden}
        />
      )}

      <ReaderPanel
        settings={settings}
        onSettingsChange={updateSettings}
        page={page}
        totalChapters={totalChapters}
        chapterProgress={chapterProgress}
        bookSlug={bookSlug}
        chapterID={chapter.id}
        hasNextChapter={hasNextChapter}
        isHidden={isOverlayHidden}
        setIsHidden={setIsOverlayHidden}
      />
    </>
  )
}

export default ReadClientPage
