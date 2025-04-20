'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { usePathname, useSearchParams } from 'next/navigation'

type CollectionPaginationProps = {
  totalPages: number
}

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
    const pages = []

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
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={hasPrevPage ? createPageURL(currentPage - 1) : ''}
            disabled={!hasPrevPage}
          />
        </PaginationItem>

        {renderPageNumbers().map((page, index) => (
          <PaginationItem key={index}>
            {typeof page === 'number' ? (
              <PaginationLink href={createPageURL(page)} isActive={currentPage === page}>
                {page}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href={hasNextPage ? createPageURL(currentPage + 1) : ''}
            disabled={!hasNextPage}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default CollectionPagination
