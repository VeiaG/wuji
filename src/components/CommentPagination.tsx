'use client'

import { Button } from './ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

type CommentPaginationProps = {
  totalPages: number
  currentPage: number
  setPage: (page: number) => void
}

const CommentPagination: React.FC<CommentPaginationProps> = ({
  totalPages,
  setPage,
  currentPage,
}) => {
  const hasPrevPage = currentPage > 1
  const hasNextPage = currentPage < totalPages

  // Get visible page numbers based on current page and total pages
  const getVisiblePageNumbers = () => {
    // For small number of pages, just show all pages
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // For large number of pages, show a limited window
    const pages = []

    // Always add first page
    pages.push(1)

    // Add ellipsis if needed
    if (currentPage > 3) {
      pages.push('ellipsis1')
    }

    // Calculate start and end of the central pages window
    let startPage = Math.max(2, currentPage - 1)
    let endPage = Math.min(totalPages - 1, currentPage + 1)

    // Adjust for edge cases
    if (currentPage <= 3) {
      endPage = Math.min(4, totalPages - 1)
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - 3)
    }

    // Add the central window pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis2')
    }

    // Always add last page if there are more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  // Don't render pagination if there's only 1 page
  if (totalPages <= 1) {
    return null
  }

  const visiblePages = getVisiblePageNumbers()

  return (
    <div className="flex justify-center items-center gap-2 mt-4">
      {/* Previous page button */}
      {hasPrevPage && (
        <Button
          variant="outline"
          onClick={() => setPage(currentPage - 1)}
          size="sm"
          aria-label="Попередня сторінка"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1">Назад</span>
        </Button>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => {
          if (page === 'ellipsis1' || page === 'ellipsis2') {
            return (
              <span
                key={`${page}`}
                className="flex items-center justify-center w-8 h-8 text-muted-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            )
          } else {
            return (
              <Button
                key={`page-${page}`}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setPage(page as number)}
                aria-label={`Сторінка ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </Button>
            )
          }
        })}
      </div>

      {/* Next page button */}
      {hasNextPage && (
        <Button
          variant="outline"
          onClick={() => setPage(currentPage + 1)}
          size="sm"
          aria-label="Наступна сторінка"
        >
          <span className="mr-1">Вперед</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default CommentPagination
