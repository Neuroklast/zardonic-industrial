'use client'

import { useMemo, useState } from 'react'
import { m } from 'framer-motion'
import {
  ApplePodcastsLogo,
  CaretDown,
  CaretUp,
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
}

type ReleaseFilter = '' | 'album' | 'ep' | 'single' | 'remix' | 'compilation'

const FILTERS: Array<{ value: ReleaseFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'album', label: 'Album' },
  { value: 'ep', label: 'EP' },
  { value: 'single', label: 'Single' },
  { value: 'remix', label: 'Remix' },
  { value: 'compilation', label: 'Compilation' },
]

function normalizeType(value: string | null | undefined): ReleaseFilter {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (
    normalized === 'album' ||
    normalized === 'ep' ||
    normalized === 'single' ||
    normalized === 'remix' ||
    normalized === 'compilation'
  ) {
    return normalized
  }
  return normalized === '' ? 'album' : ''
}

function formatReleaseDate(value: string | null) {
  if (!value) return 'UNKNOWN'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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

export function ReleasesSection({ releases }: ReleasesSectionProps) {
  const [showAll, setShowAll] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ReleaseFilter>('')

  const filteredReleases = useMemo(() => {
    const sorted = [...releases].sort((left, right) => {
      const leftTime = left.release_date ? new Date(left.release_date).getTime() : 0
      const rightTime = right.release_date ? new Date(right.release_date).getTime() : 0
      return rightTime - leftTime
    })

    if (!activeFilter) return sorted
    return sorted.filter((release) => normalizeType(release.type) === activeFilter)
  }, [activeFilter, releases])

  const visibleReleases = showAll ? filteredReleases : filteredReleases.slice(0, 8)

  return (
    <section
      id="releases"
      className="scanline-effect py-section px-card"
      style={{ zIndex: 'var(--z-content)' }}
      data-theme-color="foreground card border primary"
    >
      <div className="container mx-auto max-w-6xl">
        <m.div
          initial={{ opacity: 0, x: -30, filter: 'blur(10px)', clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
            <h2
              className="hover-chromatic hover-glitch cyber2077-scan-build cyber2077-crt-interference font-mono text-heading font-bold uppercase tracking-tighter text-foreground"
              data-text="RELEASES"
            >
              RELEASES
              <span className="animate-pulse">_</span>
            </h2>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value || 'all'}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.value)
                  setShowAll(false)
                }}
                className={`border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
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
            <div className="border border-border bg-card/50 p-12 text-center font-mono text-xl uppercase tracking-wide text-muted-foreground">
              Releases coming soon
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                {visibleReleases.map((release, index) => (
                  <m.article
                    key={release.id}
                    initial={{ opacity: 0, y: 24, clipPath: 'inset(0 0 100% 0)' }}
                    whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="cyber-card group overflow-hidden border border-border bg-card transition-all hover:border-primary/50 hover-chromatic"
                  >
                    <div className="aspect-square bg-muted">
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
                          <span>{formatReleaseDate(release.release_date)}</span>
                          <span className="border border-primary/30 px-2 py-0.5 text-primary">
                            {normalizeType(release.type) === 'album' ? 'Album' : normalizeType(release.type) || 'Release'}
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

              {filteredReleases.length > 8 ? (
                <m.div
                  className="mt-8 flex justify-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <button
                    type="button"
                    onClick={() => setShowAll((value) => !value)}
                    className="cyber-border hover-glitch inline-flex items-center gap-2 px-4 py-2 font-mono uppercase"
                  >
                    {showAll ? (
                      <>
                        <CaretUp className="h-4 w-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <CaretDown className="h-4 w-4" />
                        Show All ({filteredReleases.length})
                      </>
                    )}
                  </button>
                </m.div>
              ) : null}
            </>
          )}
        </m.div>
      </div>
    </section>
  )
}
