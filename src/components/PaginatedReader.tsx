'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import RichText from './RichText'
import { cn } from '@/lib/utils'
import { hapticTap } from '@/lib/haptics'
import { Button } from './ui/button'
import { ArrowRight, ChevronLeft, Ellipsis, List, MessageCircle } from 'lucide-react'
import { fontFamilyOptions, sizeOptions } from '@/globals/settings'
import { badgeVariants } from './ui/badge'
import { Separator } from './ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
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
const V_PAD_TOP = 24
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

const NAV_SPRING = { type: 'spring' as const, stiffness: 400, damping: 40, mass: 1 }

interface Props {
  data: DefaultTypedEditorState
  fontSize: string
  fontFamily: string
  onSettingsChange: (partial: { fontSize?: string; fontFamily?: string }) => void
  bookSlug: string
  chapterID: string
  chapterPage: number
  hasNextChapter: boolean
  chapterTitle?: string
  isSpoilerTitle?: boolean
}

export default function PaginatedReader({
  data,
  fontSize,
  fontFamily,
  onSettingsChange,
  bookSlug,
  chapterID,
  chapterPage,
  hasNextChapter,
  chapterTitle,
  isSpoilerTitle,
}: Props) {
  const router = useRouter()

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
      const clamped = Math.min(pageRef.current, pages - 1)
      pageRef.current = clamped
      setPage(clamped)
      // don't interrupt an active drag — x will snap to the correct page on pointer up
      if (!isDragging.current) {
        x.set(-clamped * pageStep())
      }
      setIsReady(true)
    })
  }, [x])

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
                'text-3xl font-bold mb-4',
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
          className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: indicatorOpacity, x: indicatorX }}
        >
          <div className="relative h-12 w-12">
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
                style={{ strokeDashoffset: ringOffset }}
              />
            </svg>
            <div
              className={cn(
                'absolute inset-[9px] rounded-full flex items-center justify-center transition-colors duration-150',
                pullArmed ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              <ArrowRight className={cn('h-4 w-4', isNavigating && 'animate-pulse')} />
            </div>
          </div>
          <span className="text-xs text-muted-foreground text-center max-w-20 leading-tight">
            {isNavigating ? 'Завантаження…' : pullArmed ? 'Відпустіть' : 'Наступний розділ'}
          </span>
        </motion.div>
      )}

      {/* Bottom navigation bar: 3-колонковий grid, щоб центр був завжди по центру
          незалежно від кількості кнопок з боків */}
      <div className="absolute bottom-0 left-0 right-0 grid grid-cols-[1fr_auto_1fr] items-center px-3 pt-2 pb-8">
        {/* Left: chapter list + prev page / prev chapter */}
        <div className="flex items-center gap-0.5 justify-self-start">
          <ChapterListSheet
            bookSlug={bookSlug}
            page={chapterPage}
            contentClassName="z-[300]"
            overlayClassName="z-[290]"
            onOpenChange={setChaptersOpen}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-40 hover:opacity-100 transition-opacity"
              aria-label="Список розділів"
            >
              <List className="h-4 w-4" />
            </Button>
          </ChapterListSheet>

          {page === 0 && chapterPage > 1 ? (
            <Button variant="ghost" size="icon" className="opacity-60 hover:opacity-100" asChild>
              <Link href={`/novel/${bookSlug}/${chapterPage - 1}`}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              disabled={page === 0}
              className="opacity-60 hover:opacity-100"
              onClick={() => goTo(page - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Center: next chapter button on last page, otherwise page counter + progress bar */}
        {isLastPage ? (
          hasNextChapter ? (
            <Button variant="default" size="sm" asChild>
              <Link href={nextChapterHref}>Наступний розділ</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/novel/${bookSlug}`}>До книги</Link>
            </Button>
          )
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs text-muted-foreground/60 font-mono tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <div className="w-24 h-1 rounded-full bg-muted-foreground/20">
              <div
                className="h-full rounded-full bg-foreground/60 transition-all duration-300"
                style={{ width: `${((page + 1) / totalPages) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Right: comments + settings popover + next page / next chapter */}
        <div className="flex items-center gap-0.5 justify-self-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-40 hover:opacity-100 transition-opacity"
            aria-label="Коментарі"
            onClick={() => setCommentsOpen(true)}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-40 hover:opacity-100 transition-opacity"
                aria-label="Налаштування читання"
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="z-[250] w-56">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Шрифт</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {fontFamilyOptions.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={fontFamily === o.value}
                        className={cn(
                          badgeVariants({
                            variant: fontFamily === o.value ? 'default' : 'outline',
                          }),
                          `${o.value} cursor-pointer select-none text-base px-2`,
                        )}
                        onClick={() => onSettingsChange({ fontFamily: o.value })}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Розмір</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {sizeOptions.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={fontSize === o.value}
                        className={cn(
                          badgeVariants({ variant: fontSize === o.value ? 'default' : 'outline' }),
                          'cursor-pointer select-none',
                        )}
                        onClick={() => onSettingsChange({ fontSize: o.value })}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  asChild
                >
                  <Link href={`/novel/${bookSlug}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Вийти
                  </Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Last page → next chapter; otherwise → next page */}
          {isLastPage && hasNextChapter ? (
            <Button variant="ghost" size="icon" className="opacity-60 hover:opacity-100" asChild>
              <Link href={nextChapterHref}>
                <ChevronLeft className="h-5 w-5 rotate-180" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              disabled={isLastPage}
              className="opacity-60 hover:opacity-100"
              onClick={() => goTo(page + 1)}
            >
              <ChevronLeft className="h-5 w-5 rotate-180" />
            </Button>
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
