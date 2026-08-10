'use client'

import { useState } from 'react'
import Link from 'next/link'
import { m, useReducedMotion } from 'framer-motion'
import { formatIsoDateCompact, formatIsoDateLong } from '@/lib/format-display-date'
import { HOMEPAGE_GIG_LIMIT } from '@/lib/browse-pagination'
import { mapGigRowToOverlayGig, type PublicGigRow } from '@/lib/gig-public-mapper'
import type { CyberpunkOverlayState } from '@/lib/app-types'
import CyberpunkOverlay from '@/components/CyberpunkOverlay'
import { useLocale } from '@/contexts/LocaleContext'
import { resolveSectionHeading } from '@/lib/section-display'
import { SectionWrapper, SectionEmpty, SectionHeading, SectionIntro } from './SectionWrapper'
import { ArrowRight, CalendarBlank, MapPin } from '@phosphor-icons/react'

interface GigsSectionProps {
  upcoming: PublicGigRow[]
  past: PublicGigRow[]
  artistName?: string
  heading?: string
  intro?: string
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
  const prefersReducedMotion = useReducedMotion()
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
            // Use animate (not whileInView): Lenis + IO can leave opacity:0 forever on the homepage
            // while /gigs browse always used animate and looked "fine". Prefer-reduced-motion: no hide.
            initial={prefersReducedMotion ? false : { opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.55,
              delay: prefersReducedMotion ? 0 : index * 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <div
              className="cyber-card hover-scan hover-noise group relative w-full cursor-pointer border border-border p-6 transition-colors hover:border-primary/50"
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

export function GigsSection({ upcoming, past, artistName = '', heading, intro }: GigsSectionProps) {
  const { t } = useLocale()
  const [overlay, setOverlay] = useState<CyberpunkOverlayState | null>(null)
  const hasGigs = upcoming.length > 0 || past.length > 0
  const title = resolveSectionHeading(heading, 'gigs', t)

  const handleGigClick = (gig: PublicGigRow) => {
    setOverlay({ type: 'gig', data: mapGigRowToOverlayGig(gig) })
  }

  return (
    <>
      <SectionWrapper id="gigs" data-theme-color="foreground card border primary">
        <SectionHeading sectionId="gigs" dataText={title}>{title}</SectionHeading>
        <SectionIntro sectionId="gigs">{intro}</SectionIntro>

        {hasGigs ? (
          <div className="space-y-10">
            <GigList gigs={upcoming} heading={t('gigs.upcoming').toUpperCase()} onGigClick={handleGigClick} />
            <GigList gigs={past} heading={t('gigs.past').toUpperCase()} onGigClick={handleGigClick} />
            {upcoming.length > HOMEPAGE_GIG_LIMIT || past.length > HOMEPAGE_GIG_LIMIT ? (
              <m.div
                initial={false}
                animate={{ opacity: 1 }}
                className="flex justify-center pt-2"
              >
                <Link
                  href="/gigs"
                  className="cyber-border hover-glitch inline-flex min-h-[44px] items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em]"
                >
                  {t('gigs.viewAll').replace('{0}', String(upcoming.length + past.length))}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </m.div>
            ) : null}
          </div>
        ) : (
          <SectionEmpty label={t('gigs.empty')} />
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