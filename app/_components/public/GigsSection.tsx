'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import { SectionWrapper, SectionEmpty } from './SectionWrapper'
import { CalendarBlank, CaretDown, CaretUp, MapPin } from '@phosphor-icons/react'

interface GigRow {
  id: string
  title: string
  venue: string | null
  city: string | null
  country: string | null
  event_date: string
  ticket_url: string | null
  festival_name: string | null
}

interface GigsSectionProps {
  upcoming: GigRow[]
  past: GigRow[]
}

const INITIAL_VISIBLE = 3

function formatEventLabel(eventDate: string) {
  const date = new Date(eventDate)
  if (Number.isNaN(date.getTime())) return eventDate.replaceAll('-', '')

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())
  return `${day}${month}${year}`
}

function formatDisplayDate(eventDate: string) {
  const date = new Date(eventDate)
  if (Number.isNaN(date.getTime())) return eventDate

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function GigList({
  gigs,
  heading,
}: {
  gigs: GigRow[]
  heading: string
}) {
  const [showAll, setShowAll] = useState(false)
  const visibleGigs = showAll ? gigs : gigs.slice(0, INITIAL_VISIBLE)

  if (gigs.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="data-label" data-theme-color="data-label">
        // {heading}
      </div>

      {visibleGigs.map((gig, index) => {
        const location = [gig.city, gig.country].filter(Boolean).join(', ')
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
            <div className="cyber-card hover-scan hover-noise relative border border-border bg-card p-6 transition-colors hover:border-primary/50">
              <div className="scan-line" aria-hidden="true" />
              <div className="data-label mb-2" data-theme-color="data-label">
                // EVENT.{formatEventLabel(gig.event_date)}
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <h3 className="font-mono text-xl font-bold uppercase hover-chromatic">
                    {gig.festival_name || gig.title}
                  </h3>
                  {gig.venue ? (
                    <p className="font-mono text-sm text-muted-foreground">{gig.venue}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-4 font-mono text-sm text-muted-foreground">
                    {location ? (
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {location}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-2">
                      <CalendarBlank className="h-4 w-4" />
                      {formatDisplayDate(gig.event_date)}
                    </span>
                  </div>
                </div>

                {gig.ticket_url ? (
                  <a
                    href={gig.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cyber-border hover-glitch inline-flex items-center justify-center px-4 py-2 font-mono text-xs uppercase tracking-[0.25em]"
                  >
                    Tickets
                  </a>
                ) : null}
              </div>
            </div>
          </m.article>
        )
      })}

      {gigs.length > INITIAL_VISIBLE ? (
        <m.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="cyber-border hover-glitch inline-flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em]"
          >
            {showAll ? (
              <>
                <CaretUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <CaretDown className="h-4 w-4" />
                Show More ({gigs.length - INITIAL_VISIBLE})
              </>
            )}
          </button>
        </m.div>
      ) : null}
    </div>
  )
}

export function GigsSection({ upcoming, past }: GigsSectionProps) {
  const hasGigs = upcoming.length > 0 || past.length > 0

  return (
    <SectionWrapper id="gigs" data-theme-color="foreground card border primary">
      <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <h2
          className="hover-chromatic hover-glitch cyber2077-scan-build cyber2077-data-corrupt font-mono text-heading font-bold uppercase tracking-tighter text-foreground"
          data-text="UPCOMING GIGS"
        >
          UPCOMING GIGS
          <span className="animate-pulse">_</span>
        </h2>
      </div>

      {hasGigs ? (
        <div className="space-y-10">
          <GigList gigs={upcoming} heading="UPCOMING" />
          <GigList gigs={past} heading="PAST" />
        </div>
      ) : (
        <SectionEmpty label="Tour dates coming soon" />
      )}
    </SectionWrapper>
  )
}
