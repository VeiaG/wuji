'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

type CollectionPaginationProps = {
  totalPages: number
}

const chipClass =
  'inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl bg-tile px-3 text-[15px] font-semibold text-soft transition-colors hover:text-foreground'

const CollectionPagination: React.FC<CollectionPaginationProps> = ({ totalPages }) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1

  const hasPrevPage = currentPage > 1
  const hasNextPage = currentPage < totalPages

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  const renderPageNumbers = () => {
    const pages: (number | '...')[] = []

    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Show pages around current page
      if (currentPage > 3) {
        pages.push('...')
      }

      const start = Math.max(2, currentPage === 1 ? 2 : currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage <= 2 ? 3 : currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <nav aria-label="Пагінація" className="flex flex-wrap items-center justify-center gap-1.5">
      {hasPrevPage ? (
        <Link href={createPageURL(currentPage - 1)} className={chipClass} aria-label="Попередня сторінка">
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Попередня</span>
        </Link>
      ) : (
        <span className={cn(chipClass, 'pointer-events-none opacity-40')} aria-hidden>
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Попередня</span>
        </span>
      )}

      {renderPageNumbers().map((page, index) =>
        typeof page === 'number' ? (
          <Link
            key={index}
            href={createPageURL(page)}
            aria-current={currentPage === page ? 'page' : undefined}
            className={cn(
              chipClass,
              currentPage === page && 'bg-primary text-primary-foreground hover:text-primary-foreground',
            )}
          >
            {page}
          </Link>
        ) : (
          <span key={index} className="inline-flex h-11 min-w-8 items-center justify-center text-muted-foreground">
            …
          </span>
        ),
      )}

      {hasNextPage ? (
        <Link href={createPageURL(currentPage + 1)} className={chipClass} aria-label="Наступна сторінка">
          <span className="hidden sm:inline">Наступна</span>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(chipClass, 'pointer-events-none opacity-40')} aria-hidden>
          <span className="hidden sm:inline">Наступна</span>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  )
}

export default CollectionPagination
