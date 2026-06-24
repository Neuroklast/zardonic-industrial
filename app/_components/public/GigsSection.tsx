'use client'

import { useState } from 'react'
import Link from 'next/link'
import { m } from 'framer-motion'
import { formatIsoDateCompact, formatIsoDateLong } from '@/lib/format-display-date'
import { HOMEPAGE_GIG_LIMIT } from '@/lib/browse-pagination'
import { mapGigRowToOverlayGig, type PublicGigRow } from '@/lib/gig-public-mapper'
import type { CyberpunkOverlayState } from '@/lib/app-types'
import CyberpunkOverlay from '@/components/CyberpunkOverlay'
import { SectionWrapper, SectionEmpty, SectionHeading } from './SectionWrapper'
import { ArrowRight, CalendarBlank, MapPin } from '@phosphor-icons/react'

interface GigsSectionProps {
  upcoming: PublicGigRow[]
  past: PublicGigRow[]
  artistName?: string
}

function formatEventLabel(eventDate: string) {
  return formatIsoDateCompact(eventDate)
}

function formatDisplayDate(eventDate: string) {
  return formatIsoDateLong(eventDate)
}

function GigList({
  gigs,
  heading,
  onGigClick,
}: {
  gigs: PublicGigRow[]
  heading: string
  onGigClick: (gig: PublicGigRow) => void
}) {
  const visibleGigs = gigs.slice(0, HOMEPAGE_GIG_LIMIT)

  if (gigs.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="data-label" data-theme-color="data-label">
        // {heading}
      </div>

      {visibleGigs.map((gig, index) => {
        const location = [gig.city, gig.country].filter(Boolean).join(', ')
        const headline = gig.festival_name || gig.title

        return (
          <m.article
            key={gig.id}
            initial={{ opacity: 0, x: -50, clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
            whileInView={{ opacity: 1, x: 0, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              delay: index * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <div
              className="cyber-card hover-scan hover-noise group relative w-full cursor-pointer border border-border bg-card p-6 transition-colors hover:border-primary/50"
              onClick={() => onGigClick(gig)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                onGigClick(gig)
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
                  <h3 className="font-mono text-xl font-bold uppercase hover-chromatic">
                    {headline}
                  </h3>
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
      })}

    </div>
  )
}

export function GigsSection({ upcoming, past, artistName = '' }: GigsSectionProps) {
  const [overlay, setOverlay] = useState<CyberpunkOverlayState | null>(null)
  const hasGigs = upcoming.length > 0 || past.length > 0

  const handleGigClick = (gig: PublicGigRow) => {
    setOverlay({ type: 'gig', data: mapGigRowToOverlayGig(gig) })
  }

  return (
    <>
      <SectionWrapper id="gigs" data-theme-color="foreground card border primary">
        <SectionHeading dataText="TOUR DATES">TOUR DATES</SectionHeading>

        {hasGigs ? (
          <div className="space-y-10">
            <GigList gigs={upcoming} heading="UPCOMING" onGigClick={handleGigClick} />
            <GigList gigs={past} heading="PAST" onGigClick={handleGigClick} />
            {upcoming.length > HOMEPAGE_GIG_LIMIT || past.length > HOMEPAGE_GIG_LIMIT ? (
              <m.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex justify-center pt-2"
              >
                <Link
                  href="/gigs"
                  className="cyber-border hover-glitch inline-flex min-h-[44px] items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em]"
                >
                  View All Events ({upcoming.length + past.length})
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </m.div>
            ) : null}
          </div>
        ) : (
          <SectionEmpty label="Tour dates coming soon" />
        )}
      </SectionWrapper>

      <CyberpunkOverlay
        overlay={overlay}
        onClose={() => setOverlay(null)}
        adminSettings={undefined}
        artistName={artistName}
      />
    </>
  )
}