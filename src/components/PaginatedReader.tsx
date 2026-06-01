'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import RichText from './RichText'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { ChevronLeft } from 'lucide-react'

// Horizontal and vertical padding inside the viewport
const H_PAD = 24
const V_PAD = 20

// Height reserved for top bar + bottom overlay + nav bar inside component
const CHROME_HEIGHT = 170

interface Props {
  data: DefaultTypedEditorState
  className?: string
}

export default function PaginatedReader({ data, className }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const colWidthRef = useRef(0)
  const totalPagesRef = useRef(1)

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isReady, setIsReady] = useState(false)

  const applyTranslate = useCallback((p: number, animated: boolean) => {
    const content = contentRef.current
    if (!content) return
    const step = colWidthRef.current + H_PAD * 2
    content.style.transition = animated ? 'transform 0.35s cubic-bezier(0.4,0,0.2,1)' : 'none'
    content.style.transform = `translateX(${-p * step}px)`
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
    const vh = Math.max(400, window.innerHeight - CHROME_HEIGHT)
    const cw = vw - H_PAD * 2

    colWidthRef.current = cw
    viewport.style.height = vh + 'px'

    content.style.transition = 'none'
    content.style.transform = 'none'
    content.style.columnWidth = cw + 'px'
    content.style.columnGap = H_PAD * 2 + 'px'
    content.style.height = vh - V_PAD * 2 + 'px'
    content.style.columnFill = 'auto'
    content.style.overflow = 'visible'

    requestAnimationFrame(() => {
      const c = contentRef.current
      if (!c) return
      const step = colWidthRef.current + H_PAD * 2
      const pages = Math.max(1, Math.round(c.scrollWidth / step))
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

  // Rebuild when font class changes (double rAF ensures styles are applied first)
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

  // Rebuild on container resize
  useEffect(() => {
    const obs = new ResizeObserver(rebuild)
    if (viewportRef.current) obs.observe(viewportRef.current)
    return () => obs.disconnect()
  }, [rebuild])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(page + 1)
      if (e.key === 'ArrowLeft') goTo(page - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page, goTo])

  const show = Math.min(totalPages, 7)
  const dotStart = totalPages > 7 ? Math.max(0, Math.min(page - 3, totalPages - 7)) : 0

  return (
    <div className="select-none">
      {/* Viewport – overflow hidden clips horizontal column overflow */}
      <div
        ref={viewportRef}
        className={cn(
          'relative overflow-hidden transition-opacity duration-300',
          !isReady && 'opacity-0',
        )}
        style={{ padding: `${V_PAD}px ${H_PAD}px` }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchStartX.current
          if (Math.abs(dx) > 40) goTo(dx < 0 ? page + 1 : page - 1)
        }}
      >
        {/* Column container – styles applied imperatively by rebuild() */}
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
          disabled={page >= totalPages - 1}
          onClick={() => goTo(page + 1)}
        >
          <ChevronLeft className="h-5 w-5 rotate-180" />
        </Button>
      </div>
    </div>
  )
}
