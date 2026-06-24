'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { m } from 'framer-motion'
import { ArrowLeft, CalendarBlank, MapPin } from '@phosphor-icons/react'
import CyberpunkOverlay from '@/components/CyberpunkOverlay'
import type { CyberpunkOverlayState } from '@/lib/app-types'
import { paginateItems } from '@/lib/browse-pagination'
import {
  browseGigs,
  GIG_TIMING_FILTERS,
  type GigTimingFilter,
} from '@/lib/gig-browse'
import { formatIsoDateCompact, formatIsoDateLong } from '@/lib/format-display-date'
import { mapGigRowToOverlayGig, type PublicGigRow } from '@/lib/gig-public-mapper'
import { BrowsePagination } from './BrowsePagination'
import { BrowseToolbar } from './BrowseToolbar'
import { SectionEmpty } from './SectionWrapper'

interface GigsBrowseClientProps {
  gigs: PublicGigRow[]
  artistName?: string
}

function formatEventLabel(eventDate: string) {
  return formatIsoDateCompact(eventDate)
}

function formatDisplayDate(eventDate: string) {
  return formatIsoDateLong(eventDate)
}

function GigBrowseCard({
  gig,
  onClick,
}: {
  gig: PublicGigRow
  onClick: () => void
}) {
  const location = [gig.city, gig.country].filter(Boolean).join(', ')
  const headline = gig.festival_name || gig.title

  return (
    <m.article
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div
        className="cyber-card hover-scan hover-noise group relative w-full cursor-pointer border border-border p-6 transition-colors hover:border-primary/50"
        onClick={() => onClick()}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          onClick()
        }}
        role="button"
        tabIndex={0}
        aria-label={`Open event details for ${headline}`}
      >
        <div className="scan-line" aria-hidden="true" />
        <div className="data-label mb-2" data-theme-color="data-label">
          // EVENT.{formatEventLabel(gig.event_date)}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-2">
            <h3 className="font-mono text-xl font-bold uppercase hover-chromatic">{headline}</h3>
            {gig.venue ? (
              <p className="font-mono text-sm text-muted-foreground">{gig.venue}</p>
            ) : null}
            <div className="flex flex-wrap gap-4 font-mono text-sm text-muted-foreground">
              {location ? (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {location}
                </span>
              ) : null}
              <span className="flex items-center gap-2">
                <CalendarBlank className="h-4 w-4 shrink-0" />
                {formatDisplayDate(gig.event_date)}
              </span>
            </div>
          </div>

          {gig.ticket_url ? (
            <a
              href={gig.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="cyber-border hover-glitch inline-flex min-h-[44px] shrink-0 items-center justify-center px-4 py-2 font-mono text-xs uppercase tracking-[0.25em]"
            >
              Tickets
            </a>
          ) : null}
        </div>
      </div>
    </m.article>
  )
}

export function GigsBrowseClient({ gigs, artistName = '' }: GigsBrowseClientProps) {
  const [overlay, setOverlay] = useState<CyberpunkOverlayState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [timingFilter, setTimingFilter] = useState<GigTimingFilter>('all')
  const [page, setPage] = useState(1)

  const filteredGigs = useMemo(
    () => browseGigs(gigs, { query: searchQuery, timingFilter }),
    [gigs, searchQuery, timingFilter],
  )

  const pagination = useMemo(() => paginateItems(filteredGigs, page), [filteredGigs, page])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handleFilterChange = (value: GigTimingFilter) => {
    setTimingFilter(value)
    setPage(1)
  }

  const handleGigClick = (gig: PublicGigRow) => {
    setOverlay({ type: 'gig', data: mapGigRowToOverlayGig(gig) })
  }

  return (
    <>
      <Link
        href="/#gigs"
        className="mb-8 inline-flex min-h-[44px] items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <BrowseToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search events by venue, city, or festival…"
        filters={GIG_TIMING_FILTERS}
        activeFilter={timingFilter}
        onFilterChange={handleFilterChange}
        resultCount={filteredGigs.length}
      />

      {filteredGigs.length === 0 ? (
        <SectionEmpty label="No events match your search" />
      ) : (
        <>
          <div className="space-y-4">
            {pagination.items.map((gig) => (
              <GigBrowseCard key={gig.id} gig={gig} onClick={() => handleGigClick(gig)} />
            ))}
          </div>

          <BrowsePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <CyberpunkOverlay
        overlay={overlay}
        onClose={() => setOverlay(null)}
        adminSettings={undefined}
        artistName={artistName}
      />
    </>
  )
}