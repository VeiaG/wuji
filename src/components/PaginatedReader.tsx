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
import { animate, motion, useMotionValue } from 'motion/react'

const H_PAD = 24
const V_PAD_TOP = 24
const V_PAD_BOT = 88
const DRAG_THRESHOLD = 0.1

const NAV_SPRING = { type: 'spring' as const, stiffness: 400, damping: 40, mass: 1 }

interface Props {
  data: DefaultTypedEditorState
  fontSize: string
  fontFamily: string
  onSettingsChange: (partial: { fontSize?: string; fontFamily?: string }) => void
  onExit: () => void
  bookSlug: string
  chapterPage: number
  chapterTitle?: string
  isSpoilerTitle?: boolean
}

export default function PaginatedReader({
  data,
  fontSize,
  fontFamily,
  onSettingsChange,
  onExit,
  bookSlug,
  chapterPage,
  chapterTitle,
  isSpoilerTitle,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const colWidthRef = useRef(0)
  const totalPagesRef = useRef(1)
  const pageRef = useRef(0)

  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragBaseOffset = useRef(0)

  const x = useMotionValue(0)

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isReady, setIsReady] = useState(false)

  const pageStep = () => colWidthRef.current + H_PAD * 2

  const goTo = useCallback(
    (target: number) => {
      const next = Math.max(0, Math.min(target, totalPagesRef.current - 1))
      pageRef.current = next
      setPage(next)
      animate(x, -next * pageStep(), NAV_SPRING)
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
      const t = e.target as HTMLElement
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable)
        return
      if (e.key === 'ArrowRight') goTo(pageRef.current + 1)
      if (e.key === 'ArrowLeft') goTo(pageRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      console.warn('[reader] pointerDown ignored — already dragging', { pointerId: e.pointerId })
      return
    }
    if (e.button !== 0 && e.pointerType !== 'touch') return
    isDragging.current = true
    dragStartX.current = e.clientX
    const currentX = x.get()
    x.set(currentX)
    dragBaseOffset.current = currentX
    console.log('[reader] pointerDown', { clientX: e.clientX, currentX, page: pageRef.current })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const newX = dragBaseOffset.current + e.clientX - dragStartX.current
    if (Math.abs(newX) > 5000) {
      console.error('[reader] LARGE translateX detected!', {
        newX,
        dragBaseOffset: dragBaseOffset.current,
        clientX: e.clientX,
        dragStartX: dragStartX.current,
        xBeforeSet: x.get(),
        page: pageRef.current,
      })
    }
    x.set(newX)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = e.clientX - dragStartX.current
    console.log('[reader] pointerUp', { clientX: e.clientX, dx, page: pageRef.current, xGet: x.get() })
    if (Math.abs(dx) > Math.max(40, colWidthRef.current * DRAG_THRESHOLD)) {
      goTo(pageRef.current + (dx < 0 ? 1 : -1))
    } else {
      animate(x, -pageRef.current * pageStep(), NAV_SPRING)
    }
  }

  const isLastPage = page >= totalPages - 1
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
        onPointerCancel={onPointerUp}
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

      {/* Bottom navigation bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pt-2 pb-8">
        {/* Prev page / prev chapter */}
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

        {/* Center: next chapter button on last page, otherwise page counter + progress bar */}
        {isLastPage ? (
          <Button variant="default" size="sm" asChild>
            <Link href={`/novel/${bookSlug}/${chapterPage + 1}`}>Наступний розділ</Link>
          </Button>
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

          {/* Last page → next chapter; otherwise → next page */}
          {isLastPage ? (
            <Button variant="ghost" size="icon" className="opacity-60 hover:opacity-100" asChild>
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
