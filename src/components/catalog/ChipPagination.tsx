'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Пагінація чипами: до 5 номерів навколо поточної сторінки
export function ChipPagination({
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
  onChange,
}: {
  page: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
  onChange: (page: number) => void
}) {
  const chip =
    'inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl bg-tile px-3 text-[15px] font-semibold text-soft transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40'

  return (
    <nav aria-label="Пагінація" className="mt-8 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={!hasPrevPage}
        className={chip}
        aria-label="Попередня сторінка"
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Попередня</span>
      </button>

      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        let pageNum
        if (totalPages <= 5) {
          pageNum = i + 1
        } else if (page <= 3) {
          pageNum = i + 1
        } else if (page >= totalPages - 2) {
          pageNum = totalPages - 4 + i
        } else {
          pageNum = page - 2 + i
        }
        const active = pageNum === page

        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => onChange(pageNum)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              chip,
              active && 'bg-primary text-primary-foreground hover:text-primary-foreground',
            )}
          >
            {pageNum}
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={!hasNextPage}
        className={chip}
        aria-label="Наступна сторінка"
      >
        <span className="hidden sm:inline">Наступна</span>
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
