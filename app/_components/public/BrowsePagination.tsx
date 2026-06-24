'use client'

import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { getPaginationRange } from '@/lib/browse-pagination'

interface BrowsePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function BrowsePagination({ currentPage, totalPages, onPageChange }: BrowsePaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPaginationRange(currentPage, totalPages)

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 border border-border px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Previous page"
      >
        <CaretLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {pages.map((page, index) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 font-mono text-xs text-muted-foreground"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center border px-3 font-mono text-xs uppercase tracking-wider transition-colors ${
              page === currentPage
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 border border-border px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <CaretRight className="h-4 w-4" />
      </button>
    </nav>
  )
}