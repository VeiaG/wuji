'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import RichText from './RichText'
import { cn } from '@/lib/utils'
import { hapticTap } from '@/lib/haptics'
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  List,
  MessageCircle,
  TextSelect,
} from 'lucide-react'
import type { Settings } from '@/globals/settings'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { ReaderSettings } from './reader/ReaderSettings'
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
import TextSelectionPopup from './text-selection-popup'

const H_PAD = 24
const V_PAD_TOP = 52
const V_PAD_BOT = 88
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
// Довге натискання (тач) → режим виділення для скарги; свайпи в цей час заморожені
const PRESS_SHOW_DELAY = 300 // мс тиші: коротші дотики й свайпи кільце не показують і не рахують
const PRESS_DURATION = 700 // мс заповнення кільця — відлік починається лише після появи
const PRESS_MOVE_TOLERANCE = 10 // px — більший рух = свайп, не довге натискання
const PRESS_LIFT = 72 // px — кільце над пальцем, щоб його було видно

// Кнопки нижньої панелі: без фону й напівпрозорі, щоб не відволікати від тексту
const ghostButton =
  'grid size-10 place-items-center rounded-xl text-foreground opacity-50 transition-opacity hover:opacity-100 cursor-pointer disabled:pointer-events-none disabled:opacity-20'

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
  chapterID: string
  bookId: string
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
  chapterID,
  bookId,
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

  // Режим виділення: довге натискання на тачі. Мишею виділяти можна завжди
  const [textEl, setTextEl] = useState<HTMLDivElement | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [press, setPress] = useState<{ x: number; y: number } | null>(null)
  const pressProgress = useMotionValue(0)
  const pressRingOffset = useTransform(pressProgress, (p) => RING_C * (1 - p))
  const pressStart = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const pressTimer = useRef<number>(0)
  const pressAnimationRef = useRef<AnimationPlaybackControls | null>(null)
  const longPressFired = useRef(false)

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
      if (commentsOpen || chaptersOpen || selectMode) return
      const t = e.target as HTMLElement
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable)
        return
      if (e.key === 'ArrowRight') goTo(pageRef.current + 1)
      if (e.key === 'ArrowLeft') goTo(pageRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, commentsOpen, chaptersOpen, selectMode])

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

  const cancelPress = () => {
    window.clearTimeout(pressTimer.current)
    pressAnimationRef.current?.stop()
    pressStart.current = null
    pressProgress.set(0)
    setPress(null)
  }

  useEffect(() => () => window.clearTimeout(pressTimer.current), [])

  // Виділяємо слово під пальцем — далі його можна розширити системними маркерами
  const selectWordAt = (px: number, py: number) => {
    let node: Node | null = null
    let offset = 0
    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(px, py)
      node = pos?.offsetNode ?? null
      offset = pos?.offset ?? 0
    } else if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(px, py)
      node = range?.startContainer ?? null
      offset = range?.startOffset ?? 0
    }
    if (!node || node.nodeType !== Node.TEXT_NODE || !textEl?.contains(node)) return
    const selection = window.getSelection()
    if (!selection) return
    const range = document.createRange()
    range.setStart(node, offset)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    selection.modify?.('move', 'backward', 'word')
    selection.modify?.('extend', 'forward', 'word')
  }

  const enterSelectMode = () => {
    const start = pressStart.current
    cancelPress()
    if (!start) return
    longPressFired.current = true
    // Заморожуємо сторінку: гасимо перетягування й повертаємо текст на місце
    isDragging.current = false
    if (canPull.current) {
      canPull.current = false
      resetPull()
    }
    animationRef.current?.stop()
    animationRef.current = animate(x, -pageRef.current * pageStep(), NAV_SPRING)
    try {
      viewportRef.current?.releasePointerCapture(start.pointerId)
    } catch {
      // захоплення вже знято
    }
    hapticTap()
    setSelectMode(true)
    // select-text застосується після рендеру
    requestAnimationFrame(() => selectWordAt(start.x, start.y))
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    window.getSelection()?.removeAllRanges()
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current || isNavigating || selectMode) return
    // Миша не гортає перетягуванням — нею виділяють текст (гортання: стрілки, кнопки, клавіатура)
    if (e.pointerType === 'mouse') return
    if ((e.target as HTMLElement).closest('a, button')) return
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

    longPressFired.current = false
    pressStart.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId }
    pressTimer.current = window.setTimeout(() => {
      const start = pressStart.current
      if (!start) return
      setPress({ x: start.x, y: start.y })
      pressAnimationRef.current = animate(pressProgress, 1, {
        duration: PRESS_DURATION / 1000,
        ease: 'linear',
        onComplete: enterSelectMode,
      })
    }, PRESS_SHOW_DELAY)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pressStart.current
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > PRESS_MOVE_TOLERANCE) {
      cancelPress()
    }
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
    cancelPress()
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
          'absolute inset-0 overflow-hidden',
          // На десктопі — колонка як у режимі стрічки, а не на всю ширину
          'desk:left-1/2 desk:right-auto desk:w-[760px] desk:-translate-x-1/2',
          'transition-opacity duration-300',
          selectMode ? 'select-text' : 'select-none [@media(pointer:fine)]:select-text',
          !isReady && 'opacity-0',
        )}
        style={{
          paddingTop: `${V_PAD_TOP}px`,
          paddingBottom: `${V_PAD_BOT}px`,
          paddingLeft: `${H_PAD}px`,
          paddingRight: `${H_PAD}px`,
          // У режимі виділення віддаємо дотики браузеру — для системних маркерів виділення
          touchAction: selectMode ? 'auto' : 'none',
          WebkitTouchCallout: selectMode ? 'default' : 'none',
        }}
        onContextMenu={(e) => {
          // Системне меню довгого натискання заважає нашому жесту
          if (pressStart.current || longPressFired.current) e.preventDefault()
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
          {/* Окрема обгортка без заголовка — зсуви скарг рахуються лише по тексту розділу */}
          <div ref={setTextEl}>
            <RichText data={data} className={richTextClass} />
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 break-inside-avoid">
            {hasNextChapter ? (
              <Link
                href={nextChapterHref}
                className="flex min-h-[84px] flex-col justify-center gap-1 rounded-tile-sm bg-primary px-5 py-4 text-primary-foreground"
              >
                <span className="text-[13px] font-semibold opacity-80">Наступний →</span>
                <span className="font-bold">Розділ {chapterPage + 1}</span>
              </Link>
            ) : (
              <Link
                href={`/novel/${bookSlug}`}
                className="flex min-h-[84px] flex-col justify-center gap-1 rounded-tile-sm bg-tile px-5 py-4"
              >
                <span className="text-[13px] font-semibold text-muted-foreground">Це останній розділ</span>
                <span className="font-bold">До книги →</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCommentsOpen(true)}
              className="flex min-h-[84px] flex-col justify-center gap-1 rounded-tile-sm bg-tile px-5 py-4 text-left"
            >
              <span className="text-[13px] font-semibold text-muted-foreground">Обговорення</span>
              <span className="font-bold">Коментарі</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Десктоп: поля по боках колонки гортають сторінки, стрілка видна лише при наведенні */}
      {(['prev', 'next'] as const).map((dir) => {
        const disabled = dir === 'prev' ? page <= 0 : isLastPage
        return (
          <button
            key={dir}
            type="button"
            aria-label={dir === 'prev' ? 'Попередня сторінка' : 'Наступна сторінка'}
            disabled={disabled}
            onClick={() => goTo(page + (dir === 'prev' ? -1 : 1))}
            className={cn(
              'group absolute inset-y-0 hidden w-[calc(50%-380px)] cursor-pointer items-center px-8 desk:flex disabled:cursor-default',
              dir === 'prev' ? 'left-0 justify-end' : 'right-0 justify-start',
            )}
          >
            <span className="grid size-12 place-items-center rounded-full bg-tile text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-disabled:!opacity-0">
              {dir === 'prev' ? <ChevronLeft className="size-6" /> : <ChevronRight className="size-6" />}
            </span>
          </button>
        )
      })}

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

      {/* Кільце довгого натискання — над пальцем */}
      {press && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10"
          style={{ left: press.x - 24, top: Math.max(8, press.y - 24 - PRESS_LIFT) }}
        >
          <div className="relative h-12 w-12 rounded-full bg-background/90 shadow-float">
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
                style={{ strokeDashoffset: pressRingOffset }}
              />
            </svg>
            <div className="absolute inset-[9px] flex items-center justify-center text-muted-foreground">
              <TextSelect className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}

      {textEl && (
        <TextSelectionPopup
          chapterId={chapterID}
          bookId={bookId}
          pageNumber={chapterPage}
          target={textEl}
          elevated
          positionClassName="bottom-[calc(max(2rem,env(safe-area-inset-bottom))+52px)]"
          hint={selectMode ? 'Виділіть фрагмент, щоб поскаржитись на переклад' : undefined}
          onDismiss={exitSelectMode}
        />
      )}

      {/* Лише кнопка назад до книги — номер розділу й прогрес тут зайві */}
      <Link
        href={`/novel/${bookSlug}`}
        aria-label="Назад до книги"
        className={cn(ghostButton, 'absolute top-2 left-2')}
      >
        <ArrowLeft className="size-5" />
      </Link>

      {/* Нижня панель: мінімальна і без фону, бо в цьому режимі вона завжди на екрані.
          3-колонковий grid, щоб лічильник був завжди по центру */}
      <div className="absolute bottom-0 left-0 right-0 grid grid-cols-[1fr_auto_1fr] items-center px-3 pt-2 pb-[max(2rem,env(safe-area-inset-bottom))] desk:mx-auto desk:max-w-[760px]">
        <div className="flex items-center gap-0.5 justify-self-start">
          <ChapterListSheet
            bookSlug={bookSlug}
            page={chapterPage}
            contentClassName="z-[300]"
            overlayClassName="z-[290]"
            onOpenChange={setChaptersOpen}
          >
            <button type="button" className={ghostButton} aria-label="Список розділів">
              <List className="size-4" />
            </button>
          </ChapterListSheet>

          {page === 0 && chapterPage > 1 ? (
            <Link
              href={`/novel/${bookSlug}/${chapterPage - 1}`}
              className={ghostButton}
              aria-label="Попередній розділ"
            >
              <ChevronLeft className="size-5" />
            </Link>
          ) : (
            <button
              type="button"
              className={ghostButton}
              aria-label="Попередня сторінка"
              disabled={page === 0}
              onClick={() => goTo(page - 1)}
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs tabular-nums text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <span className="block h-1 w-24 overflow-hidden rounded-full bg-muted-foreground/20">
            <span
              className="block h-full rounded-full bg-primary/80 transition-all duration-300"
              style={{ width: `${((page + 1) / totalPages) * 100}%` }}
            />
          </span>
        </div>

        <div className="flex items-center gap-0.5 justify-self-end">
          <button
            type="button"
            className={ghostButton}
            aria-label="Коментарі"
            onClick={() => setCommentsOpen(true)}
          >
            <MessageCircle className="size-4" />
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Налаштування читання"
                className={cn(ghostButton, 'font-display text-[13px] font-extrabold')}
              >
                Aa
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={10}
              className="z-[250] w-auto rounded-tile-sm p-4"
            >
              <ReaderSettings settings={settings} onChange={onSettingsChange} />
            </PopoverContent>
          </Popover>

          {isLastPage && hasNextChapter ? (
            <Link href={nextChapterHref} className={ghostButton} aria-label="Наступний розділ">
              <ChevronRight className="size-5" />
            </Link>
          ) : (
            <button
              type="button"
              className={ghostButton}
              aria-label="Наступна сторінка"
              disabled={isLastPage}
              onClick={() => goTo(page + 1)}
            >
              <ChevronRight className="size-5" />
            </button>
          )}
        </div>
      </div>

      <ChapterCommentsPanel
        chapterID={chapterID}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </div>
  )
}
