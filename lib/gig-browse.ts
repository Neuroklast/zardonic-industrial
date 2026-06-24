import { normalizeSearchQuery } from '@/lib/browse-pagination'
import type { PublicGigRow } from '@/lib/gig-public-mapper'

export type GigTimingFilter = 'all' | 'upcoming' | 'past'

export const GIG_TIMING_FILTERS: Array<{ value: GigTimingFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

export function splitGigsByDate(gigs: PublicGigRow[], now: Date = new Date()): {
  upcoming: PublicGigRow[]
  past: PublicGigRow[]
} {
  const upcoming = gigs.filter((gig) => new Date(gig.event_date) >= now)
  const past = gigs.filter((gig) => new Date(gig.event_date) < now).reverse()
  return { upcoming, past }
}

export function isGigUpcoming(gig: PublicGigRow, now: Date = new Date()): boolean {
  return new Date(gig.event_date) >= now
}

export function searchGigs(gigs: PublicGigRow[], query: string): PublicGigRow[] {
  const normalized = normalizeSearchQuery(query)
  if (!normalized) return gigs

  return gigs.filter((gig) => {
    const headline = gig.festival_name || gig.title
    const haystack = [
      headline,
      gig.title,
      gig.venue ?? '',
      gig.city ?? '',
      gig.country ?? '',
      gig.festival_name ?? '',
      gig.event_date,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

export function filterGigsByTiming(
  gigs: PublicGigRow[],
  timingFilter: GigTimingFilter,
  now: Date = new Date(),
): PublicGigRow[] {
  if (timingFilter === 'upcoming') {
    return gigs.filter((gig) => isGigUpcoming(gig, now))
  }
  if (timingFilter === 'past') {
    return gigs.filter((gig) => !isGigUpcoming(gig, now))
  }
  return gigs
}

export function sortGigsForBrowse(
  gigs: PublicGigRow[],
  timingFilter: GigTimingFilter,
): PublicGigRow[] {
  const sorted = [...gigs].sort(
    (left, right) => new Date(left.event_date).getTime() - new Date(right.event_date).getTime(),
  )

  if (timingFilter === 'past') {
    return sorted.reverse()
  }
  if (timingFilter === 'all') {
    const { upcoming, past } = splitGigsByDate(sorted)
    return [...upcoming, ...past]
  }

  return sorted
}

export function browseGigs(
  gigs: PublicGigRow[],
  options: { query?: string; timingFilter?: GigTimingFilter; now?: Date } = {},
): PublicGigRow[] {
  const timingFilter = options.timingFilter ?? 'all'
  const filtered = filterGigsByTiming(gigs, timingFilter, options.now)
  const searched = searchGigs(filtered, options.query ?? '')
  return sortGigsForBrowse(searched, timingFilter)
}