export const DEFAULT_BROWSE_PAGE_SIZE = 12
export const HOMEPAGE_RELEASE_LIMIT = 8
export const HOMEPAGE_GIG_LIMIT = 3

export interface PaginatedResult<T> {
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number = DEFAULT_BROWSE_PAGE_SIZE,
): PaginatedResult<T> {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const start = (currentPage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    totalItems,
    totalPages,
    currentPage,
    pageSize,
  }
}

/** Compact page number list with ellipsis for large page counts. */
export function getPaginationRange(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages: Array<number | 'ellipsis'> = [1]

  if (current > 3) pages.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (current < total - 2) pages.push('ellipsis')
  pages.push(total)

  return pages
}

export function normalizeSearchQuery(value: string): string {
  return value.trim().toLowerCase()
}