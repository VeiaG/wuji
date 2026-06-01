'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import RichText from './RichText'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { ChevronDown, ChevronLeft, ChevronUp } from 'lucide-react'

const H_PAD = 24
// Vertical padding clears the absolutely-positioned bars even when visible:
//   top bar ≈ 48px (h-12) + 8px gap  → 56px
//   settings overlay ≈ 72px + 8px gap → 80px
const V_PAD_TOP = 56
const V_PAD_BOT = 80
// Fraction of column width needed to flip page on drag release
const DRAG_THRESHOLD = 0.2

interface Props {
  data: DefaultTypedEditorState
  className?: string
  isOverlayHidden: boolean
  setIsOverlayHidden: (hidden: boolean) => void
}

export default function PaginatedReader({ data, className, isOverlayHidden, setIsOverlayHidden }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const colWidthRef = useRef(0)
  const totalPagesRef = useRef(1)

  // Drag state (imperative, not React state to avoid re-renders during drag)
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
    // Always fullscreen — use real viewport height, bars are absolutely positioned
    const vh = window.innerHeight
    const cw = vw - H_PAD * 2

    colWidthRef.current = cw
    viewport.style.height = vh + 'px'

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

  // Rebuild when font class changes (double rAF lets prose styles apply first)
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
  }, [rebuild, className])

  // Rebuild on container resize and window resize (e.g. device rotation).
  // ResizeObserver alone won't catch window resize because the viewport height
  // is set imperatively — so we add a window listener as well.
  useEffect(() => {
    const obs = new ResizeObserver(rebuild)
    if (viewportRef.current) obs.observe(viewportRef.current)
    window.addEventListener('resize', rebuild)
    return () => {
      obs.disconnect()
      window.removeEventListener('resize', rebuild)
    }
  }, [rebuild])

  // Keyboard navigation
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

  // ── Pointer drag handlers ──────────────────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button (left click / first touch)
    if (e.button !== 0 && e.pointerType !== 'touch') return
    isDragging.current = true
    dragStartX.current = e.clientX
    dragBaseOffset.current = -page * pageStep()
    const content = contentRef.current
    if (content) content.style.transition = 'none'
    // Capture so we keep receiving events even when pointer leaves the element
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStartX.current
    const content = contentRef.current
    if (content) {
      content.style.transform = `translateX(${dragBaseOffset.current + dx}px)`
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = e.clientX - dragStartX.current
    const threshold = Math.max(60, colWidthRef.current * DRAG_THRESHOLD)
    if (Math.abs(dx) > threshold) {
      goTo(dx < 0 ? page + 1 : page - 1)
    } else {
      // Snap back to current page
      applyTranslate(page, true)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  const show = Math.min(totalPages, 7)
  const dotStart = totalPages > 7 ? Math.max(0, Math.min(page - 3, totalPages - 7)) : 0

  return (
    <div className="select-none">
      {/* Viewport — overflow hidden clips column overflow, touch-action none prevents
          browser scroll interference during horizontal drag */}
      <div
        ref={viewportRef}
        className={cn(
          'relative overflow-hidden transition-opacity duration-300 cursor-grab active:cursor-grabbing',
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
        {/* Column container — styles applied imperatively by rebuild() */}
        <div ref={contentRef}>
          <RichText data={data} className={className} />
        </div>
      </div>

      {/* In-component navigation bar */}
      <div className="flex items-center justify-between px-2 py-2 border-t">
        <Button
          variant="ghost"
          size="icon"
          disabled={page === 0}
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
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

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            title={isOverlayHidden ? 'Показати панель' : 'Сховати панель'}
            onClick={() => setIsOverlayHidden(!isOverlayHidden)}
          >
            {isOverlayHidden ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          disabled={page >= totalPages - 1}
          onClick={() => goTo(page + 1)}
        >
          <ChevronLeft className="h-5 w-5 rotate-180" />
        </Button>
      </div>
    </div>
  )
}
