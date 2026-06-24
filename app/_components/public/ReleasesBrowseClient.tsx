'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { m } from 'framer-motion'
import {
  ApplePodcastsLogo,
  ArrowLeft,
  Link as LinkIcon,
  MusicNote,
  SoundcloudLogo,
  SpotifyLogo,
  Storefront,
  YoutubeLogo,
} from '@phosphor-icons/react'
import CyberpunkOverlay from '@/components/CyberpunkOverlay'
import { ReleasesSwipeLayout } from '@/components/releases/ReleasesSwipeLayout'
import type { CyberpunkOverlayState, Release } from '@/lib/app-types'
import { paginateItems } from '@/lib/browse-pagination'
import {
  browseReleases,
  normalizeReleaseFilterType,
  RELEASE_TYPE_FILTERS,
  type ReleaseTypeFilter,
} from '@/lib/release-browse'
import { formatReleaseDate } from '@/lib/format-release-date'
import type { PublicReleaseCardItem } from '@/lib/public-fetch'
import { BrowsePagination } from './BrowsePagination'
import { BrowseToolbar } from './BrowseToolbar'
import { SectionEmpty } from './SectionWrapper'

interface ReleasesBrowseClientProps {
  releases: PublicReleaseCardItem[]
  artistName?: string
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

function ReleaseBrowseCard({
  release,
  onClick,
}: {
  release: PublicReleaseCardItem
  onClick: () => void
}) {
  const typeLabel = normalizeReleaseFilterType(release.type)

  return (
    <article
      className="cyber-card group cursor-pointer overflow-hidden border border-border transition-all hover:border-primary/50 hover-chromatic"
      onClick={(event) => {
        const target = event.target
        if (target instanceof Element && target.closest('a')) return
        onClick()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onClick()
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open release details for ${release.title}`}
    >
      <div className="aspect-square overflow-hidden bg-muted">
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
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <span>{formatCardReleaseDate(release.release_date)}</span>
            <span className="border border-primary/30 px-2 py-0.5 text-primary">
              {typeLabel === 'album' ? 'Album' : typeLabel || 'Release'}
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
    </article>
  )
}

function SwipeReleaseCard({ release, onClick }: { release: PublicReleaseCardItem; onClick: () => void }) {
  return (
    <div
      className="cyber-card group cursor-pointer overflow-hidden border border-border transition-all hover:border-primary/50 hover-chromatic"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      aria-label={`Open release details for ${release.title}`}
    >
      <div className="relative aspect-square overflow-hidden bg-black">
        {release.coverUrl ? (
          <img
            src={release.coverUrl}
            alt={release.title}
            className="glitch-image h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            NO ART
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate font-mono text-sm font-bold uppercase hover-chromatic" title={release.title}>
          {release.title}
        </h3>
        {release.type ? (
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {release.type}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ReleasesBrowseClient({ releases, artistName = '' }: ReleasesBrowseClientProps) {
  const [overlay, setOverlay] = useState<CyberpunkOverlayState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ReleaseTypeFilter>('')
  const [page, setPage] = useState(1)

  const filteredReleases = useMemo(
    () => browseReleases(releases, { query: searchQuery, typeFilter }),
    [releases, searchQuery, typeFilter],
  )

  const pagination = useMemo(() => paginateItems(filteredReleases, page), [filteredReleases, page])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handleFilterChange = (value: ReleaseTypeFilter) => {
    setTypeFilter(value)
    setPage(1)
  }

  const handleReleaseClick = (item: PublicReleaseCardItem) => {
    setOverlay({ type: 'release', data: item.overlayRelease })
  }

  const layoutReleases: Release[] = pagination.items.map((item) => item.overlayRelease)

  const renderSwipeCard = (rel: Release) => {
    const item = pagination.items.find((entry) => entry.id === rel.id)
    if (!item) return null
    return <SwipeReleaseCard release={item} onClick={() => handleReleaseClick(item)} />
  }

  return (
    <>
      <Link
        href="/#releases"
        className="mb-8 inline-flex min-h-[44px] items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <BrowseToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search releases by title or type…"
        filters={RELEASE_TYPE_FILTERS}
        activeFilter={typeFilter}
        onFilterChange={handleFilterChange}
        resultCount={filteredReleases.length}
      />

      {filteredReleases.length === 0 ? (
        <SectionEmpty label="No releases match your search" />
      ) : (
        <>
          <div className="hidden gap-6 md:grid md:grid-cols-3 lg:grid-cols-4">
            {pagination.items.map((release, index) => (
              <m.div
                key={release.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <ReleaseBrowseCard release={release} onClick={() => handleReleaseClick(release)} />
              </m.div>
            ))}
          </div>

          <div className="md:hidden">
            <ReleasesSwipeLayout releases={layoutReleases} renderCard={renderSwipeCard} />
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