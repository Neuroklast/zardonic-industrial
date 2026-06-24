'use client'

import { MagnifyingGlass, X } from '@phosphor-icons/react'

interface BrowseFilterOption<T extends string> {
  value: T
  label: string
}

interface BrowseToolbarProps<T extends string> {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: Array<BrowseFilterOption<T>>
  activeFilter?: T
  onFilterChange?: (value: T) => void
  resultCount?: number
}

export function BrowseToolbar<T extends string>({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  activeFilter,
  onFilterChange,
  resultCount,
}: BrowseToolbarProps<T>) {
  return (
    <div className="mb-8 space-y-4">
      <div className="relative">
        <label htmlFor="browse-search" className="sr-only">
          Search
        </label>
        <MagnifyingGlass
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id="browse-search"
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full min-h-[44px] border border-border bg-card/60 py-2 pl-10 pr-10 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          autoComplete="off"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {filters && filters.length > 0 && onFilterChange ? (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              onClick={() => onFilterChange(filter.value)}
              className={`min-h-[44px] border px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                activeFilter === filter.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}

      {typeof resultCount === 'number' ? (
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          // {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </p>
      ) : null}
    </div>
  )
}