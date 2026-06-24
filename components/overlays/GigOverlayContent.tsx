'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CalendarBlank, CalendarPlus, MapPin, ShareNetwork, Ticket } from '@phosphor-icons/react'
import type { Gig } from '@/lib/app-types'
import type { DecorativeTexts } from '@/lib/types'
import { formatIsoDateLong } from '@/lib/format-display-date'
import { downloadGigIcs } from '@/lib/gig-ics'
import { shareGigEvent } from '@/lib/gig-share'

interface GigOverlayContentProps {
  data: Gig
  artistName?: string
  decorativeTexts?: DecorativeTexts
}

export function GigOverlayContent({ data, artistName = '', decorativeTexts }: GigOverlayContentProps) {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const dataStreamLabel = decorativeTexts?.gigDataStreamLabel ?? '// EVENT.DATA.STREAM'
  const statusPrefix = decorativeTexts?.gigStatusPrefix ?? '// SYSTEM.STATUS:'

  const handleShare = async () => {
    try {
      const result = await shareGigEvent(data, artistName)
      setShareFeedback(result === 'shared' ? 'Shared' : 'Link copied')
      window.setTimeout(() => setShareFeedback(null), 2200)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareFeedback('Share unavailable')
      window.setTimeout(() => setShareFeedback(null), 2200)
    }
  }

  const handleDownloadIcs = () => {
    try {
      downloadGigIcs(data, artistName)
    } catch {
      setShareFeedback('Calendar export failed')
      window.setTimeout(() => setShareFeedback(null), 2200)
    }
  }

  return (
    <motion.div
      data-theme-color="card border primary"
      className="mt-8 space-y-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="data-label mb-2">{dataStreamLabel}</div>
        {data.title && (
          <p className="mb-1 font-mono text-sm uppercase tracking-widest text-primary">{data.title}</p>
        )}
        <h2
          className="mb-4 font-mono text-3xl font-bold uppercase hover-chromatic crt-flash-in sm:text-4xl md:text-5xl"
          data-text={data.venue}
        >
          {data.venue}
        </h2>
        {data.soldOut && (
          <span className="inline-block border border-destructive/30 bg-destructive/20 px-3 py-1 font-mono text-xs uppercase tracking-wider text-destructive">
            SOLD OUT
          </span>
        )}
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          className="cyber-grid p-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="data-label mb-2">Location</div>
          <div className="flex items-center gap-2 font-mono text-xl hover-chromatic">
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
            {data.location}
          </div>
          {data.streetAddress && (
            <p className="ml-7 mt-2 font-mono text-sm text-muted-foreground">
              {data.streetAddress}
              {data.postalCode && `, ${data.postalCode}`}
            </p>
          )}
        </motion.div>

        <motion.div
          className="cyber-grid p-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="data-label mb-2">Date &amp; Time</div>
          <div className="flex items-center gap-2 font-mono text-xl hover-chromatic">
            <CalendarBlank className="h-5 w-5 shrink-0 text-primary" />
            {formatIsoDateLong(data.date)}
          </div>
          {data.startsAt && (
            <p className="ml-7 mt-2 font-mono text-sm text-muted-foreground">
              Doors:{' '}
              {new Date(data.startsAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </motion.div>
      </div>

      {data.description && (
        <motion.div
          className="cyber-grid p-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="data-label mb-2">Info</div>
          <p className="font-mono text-sm text-foreground/90">{data.description}</p>
        </motion.div>
      )}

      {data.lineup && data.lineup.length > 0 && (
        <motion.div
          className="cyber-grid p-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="data-label mb-3">Lineup</div>
          <div className="flex flex-wrap gap-2">
            {data.lineup.map((artist, i) => (
              <motion.span
                key={`${artist}-${i}`}
                className={`border px-3 py-1.5 font-mono text-sm transition-colors ${
                  artistName && artist.toLowerCase() === artistName.toLowerCase()
                    ? 'border-primary/50 bg-primary/20 font-bold text-primary'
                    : 'border-border bg-card text-foreground/80 hover:border-primary/30'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                {artist}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {data.support && !data.lineup?.length && (
        <motion.div
          className="cyber-grid p-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="data-label mb-2">Support Acts</div>
          <p className="font-mono text-lg text-foreground/90 hover-chromatic">{data.support}</p>
        </motion.div>
      )}

      <motion.div
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        {data.ticketUrl ? (
          <Button
            asChild
            size="lg"
            className={`min-h-[44px] w-full font-mono uppercase tracking-wider hover-noise cyber-border sm:w-auto ${data.soldOut ? 'pointer-events-none opacity-50' : ''}`}
          >
            <a href={data.ticketUrl} target="_blank" rel="noopener noreferrer">
              <Ticket className="mr-2 h-5 w-5" />
              <span className="hover-chromatic">{data.soldOut ? 'Sold Out' : 'Get Tickets'}</span>
            </a>
          </Button>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[44px] w-full font-mono uppercase tracking-wider sm:w-auto"
          onClick={handleShare}
        >
          <ShareNetwork className="mr-2 h-5 w-5" />
          <span className="hover-chromatic">{shareFeedback ?? 'Share'}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[44px] w-full font-mono uppercase tracking-wider sm:w-auto"
          onClick={handleDownloadIcs}
        >
          <CalendarPlus className="mr-2 h-5 w-5" />
          <span className="hover-chromatic">Add to Calendar</span>
        </Button>
      </motion.div>

      <motion.div
        className="border-t border-border pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="data-label">{statusPrefix} [{data.soldOut ? 'SOLD_OUT' : 'ACTIVE'}]</div>
      </motion.div>
    </motion.div>
  )
}