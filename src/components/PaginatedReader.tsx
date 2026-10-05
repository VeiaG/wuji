'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import RichText from './RichText'
import { cn } from '@/lib/utils'
import { hapticTap } from '@/lib/haptics'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, List, MessageCircle } from 'lucide-react'
import type { Settings } from '@/globals/settings'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { ReaderSettings } from './reader/ReaderSettings'
import { panelButton } from './reader/ReaderPanel'
import Link from 'next/link'
import { useRouter } from '@bprogress/next/app'
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
} from 'motion/react'
import ChapterCommentsPanel from './ChapterCommentsPanel'
import ChapterListSheet from './ChapterListSheet'

const H_PAD = 24
const V_PAD_TOP = 56
const V_PAD_BOT = 104
const DRAG_THRESHOLD = 0.1

// Overscroll за краями: текст рухається повільніше за палець
const EDGE_RESISTANCE = 0.4
// Протягування на останній сторінці → наступний розділ
const PULL_THRESHOLD = 0.35 // частка ширини колонки, яку має пройти палець
const PULL_MIN_PX = 120
const PULL_MIN_DURATION = 250 // мс — короткий змах не рахується
const PULL_COOLDOWN = 400 // мс після потрапляння на останню сторінку — захист від гортання по інерції
const RING_R = 18
const RING_C = 2 * Math.PI * RING_R

const NAV_SPRING = { type: 'spring' as const, stiffness: 400, damping: 40, mass: 1 }

// Збереження сторінки локально на пристрої (на сервер не відправляємо)
const POSITIONS_KEY = 'paginated-reader-positions'
// Один запис на книгу: прогрес розділу береться з сервера (редірект з /novel/[slug]),
// тут лише сторінка всередині поточного розділу
const POSITIONS_LIMIT = 50 // скільки останніх книг пам'ятаємо
const VIEWPORT_TOLERANCE = 200 // px — якщо розмір змінився сильніше, не відновлюємо

interface SavedPosition {
  chapterID: string
  page: number
  totalPages: number
  w: number
  h: number
  fontSize: string
  fontFamily: string
  t: number
}

const readPositions = (): Record<string, SavedPosition> => {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const savePosition = (bookSlug: string, pos: SavedPosition) => {
  try {
    const all = readPositions()
    all[bookSlug] = pos
    const trimmed = Object.entries(all)
      .sort(([, a], [, b]) => (b?.t ?? 0) - (a?.t ?? 0))
      .slice(0, POSITIONS_LIMIT)
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(Object.fromEntries(trimmed)))
  } catch {
    // localStorage недоступний або переповнений — просто не зберігаємо
  }
}

// Повертає сторінку для відновлення або null, якщо умови читання надто змінились
const restorePage = (
  bookSlug: string,
  chapterID: string,
  w: number,
  h: number,
  totalPages: number,
  fontSize: string,
  fontFamily: string,
): number | null => {
  const saved = readPositions()[bookSlug]
  if (!saved || saved.chapterID !== chapterID) return null
  if (typeof saved.page !== 'number' || saved.page <= 0) return null
  if (saved.fontSize !== fontSize || saved.fontFamily !== fontFamily) return null
  if (Math.abs(saved.w - w) > VIEWPORT_TOLERANCE || Math.abs(saved.h - h) > VIEWPORT_TOLERANCE)
    return null
  // Розмір трохи змінився → кількість сторінок могла змінитись, переносимо пропорційно
  const target =
    saved.totalPages === totalPages
      ? saved.page
      : Math.round((saved.page / Math.max(1, saved.totalPages - 1)) * (totalPages - 1))
  return Math.max(0, Math.min(target, totalPages - 1))
}

interface Props {
  data: DefaultTypedEditorState
  settings: Settings
  onSettingsChange: (partial: Partial<Settings>) => void
  bookSlug: string
  bookTitle?: string
  chapterID: string
  chapterPage: number
  hasNextChapter: boolean
  chapterTitle?: string
  isSpoilerTitle?: boolean
}

export default function PaginatedReader({
  data,
  settings,
  onSettingsChange,
  bookSlug,
  bookTitle,
  chapterID,
  chapterPage,
  hasNextChapter,
  chapterTitle,
  isSpoilerTitle,
}: Props) {
  const router = useRouter()
  const { fontSize, fontFamily } = settings

  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const colWidthRef = useRef(0)
  const totalPagesRef = useRef(1)
  const pageRef = useRef(0)

  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragBaseOffset = useRef(0)
  const animationRef = useRef<AnimationPlaybackControls | null>(null)

  const canPull = useRef(false)
  const pullArmedRef = useRef(false)
  const dragStartTime = useRef(0)
  const lastPageSince = useRef(0)
  const pullAnimationRef = useRef<AnimationPlaybackControls | null>(null)

  const restoredRef = useRef(false)

  const x = useMotionValue(0)
  const pull = useMotionValue(0) // 0..1 — прогрес протягування до наступного розділу
  const ringOffset = useTransform(pull, (p) => RING_C * (1 - p))
  const indicatorOpacity = useTransform(pull, [0, 0.15], [0, 1])
  const indicatorX = useTransform(pull, [0, 1], [24, 0])

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isReady, setIsReady] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [chaptersOpen, setChaptersOpen] = useState(false)
  const [pullArmed, setPullArmed] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  const pageStep = () => colWidthRef.current + H_PAD * 2

  const goTo = useCallback(
    (target: number) => {
      const next = Math.max(0, Math.min(target, totalPagesRef.current - 1))
      pageRef.current = next
      setPage(next)
      animationRef.current?.stop()
      animationRef.current = animate(x, -next * pageStep(), NAV_SPRING)
    },
    [x],
  )

  const rebuild = useCallback(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    if (!vw || !vh) return

    const cw = vw - H_PAD * 2
    colWidthRef.current = cw

    content.style.columnWidth = cw + 'px'
    content.style.columnGap = H_PAD * 2 + 'px'
    content.style.height = vh - V_PAD_TOP - V_PAD_BOT + 'px'
    content.style.columnFill = 'auto'
    content.style.overflow = 'visible'

    requestAnimationFrame(() => {
      const c = contentRef.current
      if (!c) return
      const pages = Math.max(1, Math.round(c.scrollWidth / pageStep()))
      totalPagesRef.current = pages
      setTotalPages(pages)
      if (!restoredRef.current) {
        restoredRef.current = true
        const restored = restorePage(bookSlug, chapterID, vw, vh, pages, fontSize, fontFamily)
        if (restored !== null) pageRef.current = restored
      }
      const clamped = Math.min(pageRef.current, pages - 1)
      pageRef.current = clamped
      setPage(clamped)
      // don't interrupt an active drag — x will snap to the correct page on pointer up
      if (!isDragging.current) {
        x.set(-clamped * pageStep())
      }
      setIsReady(true)
    })
  }, [x, bookSlug, chapterID, fontSize, fontFamily])

  useEffect(() => {
    let id1 = 0
    let id2 = 0
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(rebuild)
    })
    return () => {
      cancelAnimationFrame(id1)
      cancelAnimationFrame(id2)
    }
  }, [rebuild, fontSize, fontFamily])

  useEffect(() => {
    const obs = new ResizeObserver(rebuild)
    if (viewportRef.current) obs.observe(viewportRef.current)
    return () => obs.disconnect()
  }, [rebuild])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (commentsOpen || chaptersOpen) return
      const t = e.target as HTMLElement
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable)
        return
      if (e.key === 'ArrowRight') goTo(pageRef.current + 1)
      if (e.key === 'ArrowLeft') goTo(pageRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, commentsOpen, chaptersOpen])

  // Зберігаємо поточну сторінку разом з розміром viewport і шрифтом
  useEffect(() => {
    if (!isReady) return
    const viewport = viewportRef.current
    if (!viewport) return
    savePosition(bookSlug, {
      chapterID,
      page,
      totalPages,
      w: viewport.clientWidth,
      h: viewport.clientHeight,
      fontSize,
      fontFamily,
      t: Date.now(),
    })
  }, [isReady, page, totalPages, bookSlug, chapterID, fontSize, fontFamily])

  const isLastPage = page >= totalPages - 1

  // Момент потрапляння на останню сторінку — для cooldown протягування
  useEffect(() => {
    if (isLastPage) lastPageSince.current = Date.now()
  }, [isLastPage])

  const nextChapterHref = `/novel/${bookSlug}/${chapterPage + 1}`

  const setArmed = (armed: boolean) => {
    if (pullArmedRef.current === armed) return
    pullArmedRef.current = armed
    setPullArmed(armed)
    if (armed) hapticTap()
  }

  const resetPull = () => {
    setArmed(false)
    pullAnimationRef.current?.stop()
    pullAnimationRef.current = animate(pull, 0, NAV_SPRING)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current || isNavigating) return
    if (e.button !== 0 && e.pointerType !== 'touch') return
    animationRef.current?.stop() // stop any running spring so x is truly frozen
    pullAnimationRef.current?.stop()
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartTime.current = Date.now()
    dragBaseOffset.current = x.get()
    // Жест має початись уже на останній сторінці і не одразу після перегортання
    canPull.current =
      hasNextChapter &&
      pageRef.current >= totalPagesRef.current - 1 &&
      Date.now() - lastPageSince.current > PULL_COOLDOWN
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStartX.current
    const pos = dragBaseOffset.current + dx
    const min = -(totalPagesRef.current - 1) * pageStep()
    // Опір за межами першої/останньої сторінки
    if (pos > 0) x.set(pos * EDGE_RESISTANCE)
    else if (pos < min) x.set(min + (pos - min) * EDGE_RESISTANCE)
    else x.set(pos)

    if (canPull.current) {
      const threshold = Math.max(PULL_MIN_PX, colWidthRef.current * PULL_THRESHOLD)
      const progress = Math.min(1, Math.max(0, (min - pos) / threshold))
      pull.set(progress)
      setArmed(progress >= 1)
    }
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = e.clientX - dragStartX.current

    if (canPull.current) {
      canPull.current = false
      const commit =
        !cancelled &&
        pullArmedRef.current &&
        Date.now() - dragStartTime.current >= PULL_MIN_DURATION
      if (commit) {
        setIsNavigating(true)
        pull.set(1)
        router.push(nextChapterHref)
        return
      }
      resetPull()
    }

    if (!cancelled && Math.abs(dx) > Math.max(40, colWidthRef.current * DRAG_THRESHOLD)) {
      goTo(pageRef.current + (dx < 0 ? 1 : -1))
    } else {
      animationRef.current?.stop()
      animationRef.current = animate(x, -pageRef.current * pageStep(), NAV_SPRING)
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => endDrag(e, false)
  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => endDrag(e, true)
  const richTextClass = cn(fontSize, fontFamily)

  return (
    <div className="h-full w-full relative select-none">
      {/* Content viewport */}
      <div
        ref={viewportRef}
        className={cn(
          'absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing',
          'transition-opacity duration-300',
          !isReady && 'opacity-0',
        )}
        style={{
          paddingTop: `${V_PAD_TOP}px`,
          paddingBottom: `${V_PAD_BOT}px`,
          paddingLeft: `${H_PAD}px`,
          paddingRight: `${H_PAD}px`,
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <motion.div ref={contentRef} style={{ x }}>
          {chapterTitle && (
            <h1
              className={cn(
                'heading-display mb-6 text-[clamp(24px,6vw,32px)]',
                isSpoilerTitle && 'blur-sm hover:blur-none transition-all duration-300',
              )}
            >
              {chapterTitle}
            </h1>
          )}
          <RichText data={data} className={richTextClass} />
        </motion.div>
      </div>

      {/* Індикатор протягування до наступного розділу */}
      {hasNextChapter && (
        <motion.div
          aria-hidden
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ opacity: indicatorOpacity, x: indicatorX }}
        >
          <div className="relative h-12 w-12">
            {/* Під час завантаження кільце стає частковою дугою і крутиться */}
            <div className={cn('absolute inset-0', isNavigating && 'animate-spin')}>
              <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r={RING_R}
                  fill="none"
                  strokeWidth="3"
                  className="stroke-muted-foreground/20"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r={RING_R}
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="stroke-primary"
                  strokeDasharray={RING_C}
                  style={{ strokeDashoffset: isNavigating ? RING_C * 0.7 : ringOffset }}
                />
              </svg>
            </div>
            <div
              className={cn(
                'absolute inset-[9px] rounded-full flex items-center justify-center transition-colors duration-150',
                pullArmed ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Верхній рядок: назад до книги, розділ, прогрес */}
      <div className="absolute inset-x-0 top-0 flex items-center gap-3 px-4 pt-3 text-[13px] text-muted-foreground">
        <Link
          href={`/novel/${bookSlug}`}
          aria-label="Назад до книги"
          className="grid size-9 shrink-0 place-items-center rounded-xl transition-colors hover:bg-chip hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="min-w-0 flex-1 truncate font-semibold">
          {bookTitle ? `${bookTitle} · ` : ''}Розділ {chapterPage}
        </span>
        <span className="shrink-0 font-semibold tabular-nums">
          {Math.round(((page + 1) / totalPages) * 100)}%
        </span>
      </div>

      {/* Плаваюча нижня панель */}
      <nav
        aria-label="Панель читання"
        className="absolute inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] mx-auto max-w-[560px]"
      >
        <div className="flex items-center gap-1 rounded-[24px] bg-tile p-1.5 shadow-float">
          <ChapterListSheet
            bookSlug={bookSlug}
            page={chapterPage}
            contentClassName="z-[300]"
            overlayClassName="z-[290]"
            onOpenChange={setChaptersOpen}
          >
            <button type="button" className={panelButton} aria-label="Список розділів">
              <List className="size-5" />
            </button>
          </ChapterListSheet>

          {page === 0 && chapterPage > 1 ? (
            <Link
              href={`/novel/${bookSlug}/${chapterPage - 1}`}
              className={panelButton}
              aria-label="Попередній розділ"
            >
              <ChevronLeft className="size-5" />
            </Link>
          ) : (
            <button
              type="button"
              className={panelButton}
              aria-label="Попередня сторінка"
              aria-disabled={page === 0}
              onClick={() => goTo(page - 1)}
            >
              <ChevronLeft className="size-5" />
            </button>
          )}

          {/* Центр: на останній сторінці — перехід далі, інакше лічильник сторінок */}
          <div className="flex min-w-0 flex-1 justify-center px-1">
            {isLastPage ? (
              <Link
                href={hasNextChapter ? nextChapterHref : `/novel/${bookSlug}`}
                className={cn(
                  'inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-bold',
                  hasNextChapter ? 'bg-primary text-primary-foreground' : 'bg-chip',
                )}
              >
                {hasNextChapter ? 'Наступний розділ' : 'До книги'}
              </Link>
            ) : (
              <span className="flex flex-col items-center gap-1.5">
                <span className="text-sm font-bold tabular-nums">
                  {page + 1} <span className="font-medium text-muted-foreground">/ {totalPages}</span>
                </span>
                <span className="block h-1 w-24 overflow-hidden rounded-full bg-chip">
                  <span
                    className="block h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${((page + 1) / totalPages) * 100}%` }}
                  />
                </span>
              </span>
            )}
          </div>

          <button
            type="button"
            className={panelButton}
            aria-label="Коментарі"
            onClick={() => setCommentsOpen(true)}
          >
            <MessageCircle className="size-5" />
          </button>

          {isLastPage && hasNextChapter ? (
            <Link href={nextChapterHref} className={panelButton} aria-label="Наступний розділ">
              <ChevronRight className="size-5" />
            </Link>
          ) : (
            <button
              type="button"
              className={panelButton}
              aria-label="Наступна сторінка"
              aria-disabled={isLastPage}
              onClick={() => goTo(page + 1)}
            >
              <ChevronRight className="size-5" />
            </button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Налаштування читання"
                className={cn(panelButton, 'bg-chip font-display text-sm font-extrabold')}
              >
                Aa
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={14}
              className="z-[250] w-auto rounded-tile-sm p-4"
            >
              <ReaderSettings settings={settings} onChange={onSettingsChange} />
            </PopoverContent>
          </Popover>
        </div>
      </nav>

      <ChapterCommentsPanel
        chapterID={chapterID}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </div>
  )
}
