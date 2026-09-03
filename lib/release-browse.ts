import { normalizeSearchQuery } from '@/lib/browse-pagination'
import { normalizeReleaseType } from '@/lib/release-public-mapper'

export type ReleaseTypeFilter = '' | 'album' | 'single-ep' | 'remix' | 'compilation'

export const RELEASE_TYPE_FILTERS: Array<{ value: ReleaseTypeFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'album', label: 'Album' },
  { value: 'single-ep', label: 'Single / EP' },
  { value: 'remix', label: 'Remix' },
  { value: 'compilation', label: 'Compilation' },
]

export interface BrowsableRelease {
  id: string
  title: string
  type: string
  release_date: string | null
}

export function normalizeReleaseFilterType(value: string | null | undefined): ReleaseTypeFilter {
  const normalized = normalizeReleaseType(value ?? '')
  if (normalized === 'ep' || normalized === 'single') return 'single-ep'
  return (normalized as ReleaseTypeFilter) || ''
}

/**
 * True when a release's stored type matches a filter value. The merged
 * 'single-ep' filter matches both 'single' and 'ep'.
 */
export function matchesReleaseFilterType(
  releaseType: string,
  filter: ReleaseTypeFilter,
): boolean {
  const normalized = normalizeReleaseFilterType(releaseType)
  if (filter === 'single-ep') return normalized === 'single-ep'
  return normalized === filter
}

export function sortReleasesByDate<T extends BrowsableRelease>(releases: T[]): T[] {
  return [...releases].sort((left, right) => {
    const leftTime = left.release_date ? new Date(left.release_date).getTime() : 0
    const rightTime = right.release_date ? new Date(right.release_date).getTime() : 0
    return rightTime - leftTime
  })
}

export function filterReleasesByType<T extends BrowsableRelease>(
  releases: T[],
  typeFilter: ReleaseTypeFilter,
): T[] {
  if (!typeFilter) return releases
  return releases.filter((release) => matchesReleaseFilterType(release.type, typeFilter))
}

export function searchReleases<T extends BrowsableRelease>(releases: T[], query: string): T[] {
  const normalized = normalizeSearchQuery(query)
  if (!normalized) return releases

  return releases.filter((release) => {
    const haystack = [
      release.title,
      release.type,
      release.release_date ?? '',
      normalizeReleaseFilterType(release.type),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

export function browseReleases<T extends BrowsableRelease>(
  releases: T[],
  options: { query?: string; typeFilter?: ReleaseTypeFilter } = {},
): T[] {
  const sorted = sortReleasesByDate(releases)
  const searched = searchReleases(sorted, options.query ?? '')
  return filterReleasesByType(searched, options.typeFilter ?? '')
}