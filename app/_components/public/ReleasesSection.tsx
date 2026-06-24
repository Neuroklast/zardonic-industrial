'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { m, useReducedMotion } from 'framer-motion'
import { formatReleaseDate } from '@/lib/format-release-date'
import { HOMEPAGE_RELEASE_LIMIT } from '@/lib/browse-pagination'
import {
  normalizeReleaseFilterType,
  RELEASE_TYPE_FILTERS,
  sortReleasesByDate,
  type ReleaseTypeFilter,
} from '@/lib/release-browse'
import { SectionWrapper, SectionEmpty, SectionHeading } from './SectionWrapper'
import {
  ApplePodcastsLogo,
  ArrowRight,
  Link as LinkIcon,
  MusicNote,
  SoundcloudLogo,
  SpotifyLogo,
  Storefront,
  YoutubeLogo,
} from '@phosphor-icons/react'

interface Release {
  id: string
  title: string
  type: string
  release_date: string | null
  coverUrl: string | null
  streamingLinks: Array<{ platform: string; url: string }>
}

interface ReleasesSectionProps {
  releases: Release[]
  onReleaseClick?: (release: Release) => void
  columns?: string
  cardVariant?: string
  hoverEffect?: string
}

function formatCardReleaseDate(value: string | null) {
  if (!value) return 'UNKNOWN'
  const formatted = formatReleaseDate(value, value.slice(0, 4))
  return formatted || value
}

function getPlatformIcon(platform: string) {
  switch (platform.trim().toLowerCase()) {
    case 'spotify':
      return SpotifyLogo
    case 'youtube':
      return YoutubeLogo
    case 'soundcloud':
      return SoundcloudLogo
    case 'bandcamp':
      return Storefront
    case 'applemusic':
    case 'apple music':
      return ApplePodcastsLogo
    default:
      return LinkIcon
  }
}

export function ReleasesSection({ releases, onReleaseClick, columns, cardVariant, hoverEffect }: ReleasesSectionProps) {
  const [activeFilter, setActiveFilter] = useState<ReleaseTypeFilter>('')
  const prefersReducedMotion = useReducedMotion()

  const filteredReleases = useMemo(() => {
    const sorted = sortReleasesByDate(releases)
    if (!activeFilter) return sorted
    return sorted.filter((release) => normalizeReleaseFilterType(release.type) === activeFilter)
  }, [activeFilter, releases])

  const visibleReleases = filteredReleases.slice(0, HOMEPAGE_RELEASE_LIMIT)

  const colsClass = (() => {
    const c = columns ?? '4'
    if (c === '2') return 'grid-cols-1 xs:grid-cols-2'
    if (c === '3') return 'grid-cols-1 xs:grid-cols-2 md:grid-cols-3'
    return 'grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  })()

  const cardExtra = [
    cardVariant === 'square-cover' ? 'aspect-square' : '',
    hoverEffect === 'zoom' ? 'hover:scale-[1.03]' : hoverEffect === 'glow' ? 'release-hover-glow' : '',
  ].filter(Boolean).join(' ')

  return (
    <SectionWrapper id="releases" data-theme-color="foreground card border primary">
      <SectionHeading dataText="RELEASES">RELEASES</SectionHeading>

          <div className="mb-6 flex flex-wrap gap-2">
            {RELEASE_TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value || 'all'}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`border px-3 py-2 min-h-[44px] font-mono text-xs uppercase tracking-wider transition-colors ${
                  activeFilter === filter.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {filteredReleases.length === 0 ? (
            <SectionEmpty label="Releases coming soon" />
          ) : (
            <>
              <div className={`grid ${colsClass} gap-6`}>
                {visibleReleases.map((release, index) => (
                  <m.article
                    key={release.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 24, clipPath: 'inset(0 0 100% 0)' }}
                    whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
                    viewport={prefersReducedMotion ? undefined : { once: true }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.6, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }
                    }
                    className={`cyber-card group overflow-hidden border border-border transition-all hover:border-primary/50 hover-chromatic ${cardExtra} ${
                      onReleaseClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={(event) => {
                      if (!onReleaseClick) return
                      const target = event.target
                      if (target instanceof Element && target.closest('a')) return
                      onReleaseClick(release)
                    }}
                    onKeyDown={(event) => {
                      if (!onReleaseClick) return
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      event.preventDefault()
                      onReleaseClick(release)
                    }}
                    tabIndex={onReleaseClick ? 0 : undefined}
                    role={onReleaseClick ? 'button' : undefined}
                    aria-label={onReleaseClick ? `Open release details for ${release.title}` : undefined}
                  >
                    <div className="aspect-square bg-muted overflow-hidden">
                      {release.coverUrl ? (
                        <img
                          src={release.coverUrl}
                          alt={release.title}
                          className="glitch-image h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <MusicNote className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 p-4">
                      <div className="space-y-2">
                        <div className="data-label" data-theme-color="data-label">
                          // REL.{release.release_date?.slice(0, 4) ?? '----'}
                        </div>
                        <h3 className="truncate font-mono text-sm font-bold uppercase hover-chromatic" title={release.title}>
                          {release.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                          <span>{formatCardReleaseDate(release.release_date)}</span>
                          <span className="border border-primary/30 px-2 py-0.5 text-primary">
                            {normalizeReleaseFilterType(release.type) === 'album'
                              ? 'Album'
                              : normalizeReleaseFilterType(release.type) || 'Release'}
                          </span>
                        </div>
                      </div>

                      {release.streamingLinks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {release.streamingLinks.map((link) => {
                            const Icon = getPlatformIcon(link.platform)
                            return (
                              <a
                                key={`${release.id}-${link.platform}-${link.url}`}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${release.title} on ${link.platform}`}
                                className="cyber-border inline-flex items-center gap-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] hover-glitch"
                              >
                                <Icon className="h-3.5 w-3.5" />
                                <span>{link.platform}</span>
                              </a>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  </m.article>
                ))}
              </div>

              {filteredReleases.length > HOMEPAGE_RELEASE_LIMIT ? (
                <m.div
                  className="mt-8 flex justify-center"
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
                  viewport={prefersReducedMotion ? undefined : { once: true }}
                >
                  <Link
                    href="/releases"
                    className="cyber-border hover-glitch inline-flex min-h-[44px] items-center gap-2 px-4 py-2 font-mono uppercase"
                  >
                    View All ({filteredReleases.length})
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </m.div>
              ) : null}
            </>
          )}
    </SectionWrapper>
  )
}
