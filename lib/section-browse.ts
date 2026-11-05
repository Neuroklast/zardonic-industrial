import { normalizeSearchQuery } from '@/lib/browse-pagination'

export type SectionBrowseSort = 'editorial' | 'title-asc' | 'title-desc'

export const SECTION_BROWSE_SORT_OPTIONS: Array<{ value: SectionBrowseSort; label: string }> = [
  { value: 'editorial', label: 'Editorial order' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
]

export function browseSectionItems<T extends { title: string; description?: string | null }>(
  items: T[],
  search: string,
  sort: SectionBrowseSort,
): T[] {
  const query = normalizeSearchQuery(search)
  const matching = query
    ? items.filter((item) => `${item.title} ${item.description ?? ''}`.toLowerCase().includes(query))
    : [...items]

  if (sort === 'editorial') return matching
  return matching.sort((a, b) => {
    const comparison = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    return sort === 'title-asc' ? comparison : -comparison
  })
}
