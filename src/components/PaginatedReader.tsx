'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import RichText from './RichText'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { ChevronLeft, Ellipsis } from 'lucide-react'
import { fontFamilyOptions, sizeOptions } from '@/globals/settings'
import { badgeVariants } from './ui/badge'
import { Separator } from './ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import Link from 'next/link'

const H_PAD = 24
const V_PAD_TOP = 24  // comfortable top margin (no top bar in zen mode)
const V_PAD_BOT = 88  // bottom bar (~56px) + 32px lift above iOS home indicator + gap
const DRAG_THRESHOLD = 0.2

interface Props {
  data: DefaultTypedEditorState
  fontSize: string
  fontFamily: string
  onSettingsChange: (partial: { fontSize?: string; fontFamily?: string }) => void
  onExit: () => void
  bookSlug: string
  chapterPage: number
}

export default function PaginatedReader({
  data,
  fontSize,
  fontFamily,
  onSettingsChange,
  onExit,
  bookSlug,
  chapterPage,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const colWidthRef = useRef(0)
  const totalPagesRef = useRef(1)

  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragBaseOffset = useRef(0)

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isReady, setIsReady] = useState(false)

  const pageStep = () => colWidthRef.current + H_PAD * 2

  const applyTranslate = useCallback((p: number, animated: boolean) => {
    const content = contentRef.current
    if (!content) return
    content.style.transition = animated ? 'transform 0.32s cubic-bezier(0.4,0,0.2,1)' : 'none'
    content.style.transform = `translateX(${-p * pageStep()}px)`
  }, [])

  const goTo = useCallback(
    (target: number) => {
      const next = Math.max(0, Math.min(target, totalPagesRef.current - 1))
      setPage(next)
      applyTranslate(next, true)
    },
    [applyTranslate],
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

    content.style.transition = 'none'
    content.style.transform = 'none'
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
      setPage((prev) => {
        const clamped = Math.min(prev, pages - 1)
        applyTranslate(clamped, false)
        return clamped
      })
      setIsReady(true)
    })
  }, [applyTranslate])

  // Rebuild when font settings change (double rAF lets prose styles apply first)
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

  // Observe viewport resize (covers device rotation and parent resize)
  useEffect(() => {
    const obs = new ResizeObserver(rebuild)
    if (viewportRef.current) obs.observe(viewportRef.current)
    return () => obs.disconnect()
  }, [rebuild])

  // Keyboard navigation — skip when focus is in an editable element
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t.isContentEditable
      )
        return
      if (e.key === 'ArrowRight') goTo(page + 1)
      if (e.key === 'ArrowLeft') goTo(page - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page, goTo])

  // ── Pointer drag ────────────────────────────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType !== 'touch') return
    isDragging.current = true
    dragStartX.current = e.clientX
    dragBaseOffset.current = -page * pageStep()
    const content = contentRef.current
    if (content) content.style.transition = 'none'
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const content = contentRef.current
    if (content)
      content.style.transform = `translateX(${dragBaseOffset.current + e.clientX - dragStartX.current}px)`
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = e.clientX - dragStartX.current
    if (Math.abs(dx) > Math.max(60, colWidthRef.current * DRAG_THRESHOLD)) {
      goTo(dx < 0 ? page + 1 : page - 1)
    } else {
      applyTranslate(page, true)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────

  const show = Math.min(totalPages, 7)
  const dotStart = totalPages > 7 ? Math.max(0, Math.min(page - 3, totalPages - 7)) : 0
  const isLastPage = page >= totalPages - 1

  const richTextClass = cn(fontSize, fontFamily)

  return (
    <div className="h-full w-full relative select-none">
      {/* Content viewport — fills parent, bars overlay via absolute positioning */}
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
        onPointerCancel={onPointerUp}
      >
        <div ref={contentRef}>
          <RichText data={data} className={richTextClass} />
        </div>
      </div>

      {/* Minimal bottom navigation bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pt-2 pb-8">
        {/* Prev page */}
        <Button
          variant="ghost"
          size="icon"
          disabled={page === 0}
          className="opacity-60 hover:opacity-100"
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Center: page counter + dots */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs text-muted-foreground/60 font-mono tabular-nums">
            {page + 1} / {totalPages}
          </span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              {Array.from({ length: show }, (_, i) => {
                const idx = dotStart + i
                return (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Перейти на сторінку ${idx + 1}`}
                    aria-current={idx === page ? 'true' : undefined}
                    onClick={() => goTo(idx)}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all duration-200',
                      idx === page
                        ? 'bg-foreground scale-125'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/60',
                    )}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Right: settings popover + next page / next chapter */}
        <div className="flex items-center gap-0.5">
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
            <PopoverContent side="top" align="end" className="w-56">
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
                          badgeVariants({ variant: fontFamily === o.value ? 'default' : 'outline' }),
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
                  onClick={onExit}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Вийти
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Last page → link to next chapter; otherwise → next page */}
          {isLastPage ? (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-60 hover:opacity-100"
              asChild
            >
              <Link href={`/novel/${bookSlug}/${chapterPage + 1}`}>
                <ChevronLeft className="h-5 w-5 rotate-180" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-60 hover:opacity-100"
              onClick={() => goTo(page + 1)}
            >
              <ChevronLeft className="h-5 w-5 rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
