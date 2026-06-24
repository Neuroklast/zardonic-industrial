'use client'

import { useState, useMemo } from 'react'

import CyberpunkOverlay from '@/components/CyberpunkOverlay'
import type { CyberpunkOverlayState, Release } from '@/lib/app-types'
import { ReleasesSection } from './ReleasesSection'
import { ReleasesSwipeLayout } from '@/components/releases/ReleasesSwipeLayout'
import { Releases3DCarouselLayout } from '@/components/releases/Releases3DCarouselLayout'
import {
  normalizeReleaseFilterType,
  RELEASE_TYPE_FILTERS,
  sortReleasesByDate,
  type ReleaseTypeFilter,
} from '@/lib/release-browse'
import { SectionWrapper, SectionEmpty, SectionHeading } from './SectionWrapper'

interface PublicReleaseCardItem {
  id: string
  title: string
  type: string
  release_date: string | null
  coverUrl: string | null
  streamingLinks: Array<{ platform: string; url: string }>
  manually_edited?: boolean
  overlayRelease: Release
}

interface PublicPageClientProps {
  releases: PublicReleaseCardItem[]
  artistName?: string
  releaseLayout?: 'grid' | 'swipe' | 'carousel-3d'
  releaseColumns?: string
  releaseCardVariant?: string
  releaseHoverEffect?: string
}

function mapToLayoutRelease(item: PublicReleaseCardItem): Release {
  return item.overlayRelease
}

function PublicReleaseCard({ item, onClick }: { item: PublicReleaseCardItem; onClick: () => void }) {
  return (
    <div
      className="cyber-card group overflow-hidden border border-border bg-card/50 transition-all hover:border-primary/50 hover-chromatic cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      <div className="relative aspect-square overflow-hidden bg-black">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt={item.title}
            className="glitch-image h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground font-mono text-xs">NO ART</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate font-mono text-sm font-bold uppercase hover-chromatic" title={item.title}>{item.title}</h3>
        {item.type && (
          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">{item.type}</div>
        )}
      </div>
    </div>
  )
}

export function PublicPageClient({ releases, artistName = '', releaseLayout = 'grid', releaseColumns = '4', releaseCardVariant, releaseHoverEffect }: PublicPageClientProps) {
  const [overlay, setOverlay] = useState<CyberpunkOverlayState | null>(null)
  const [activeFilter, setActiveFilter] = useState<ReleaseTypeFilter>('')

  const handleReleaseClick = (item: PublicReleaseCardItem) => {
    setOverlay({ type: 'release', data: item.overlayRelease })
  }

  const isFancy = releaseLayout === 'swipe' || releaseLayout === 'carousel-3d'

  // For fancy layouts (and potential future), compute filtered list
  const filteredReleases = useMemo(() => {
    const sorted = sortReleasesByDate(releases)
    if (!activeFilter) return sorted
    return sorted.filter((release) => normalizeReleaseFilterType(release.type) === activeFilter)
  }, [activeFilter, releases])

  const layoutReleases = filteredReleases.map(mapToLayoutRelease)

  const renderLayoutCard = (rel: Release, index: number) => {
    const item = filteredReleases[index] || filteredReleases.find(r => r.id === rel.id)
    if (!item) return null
    return <PublicReleaseCard item={item} onClick={() => handleReleaseClick(item)} />
  }

  const handleFilter = (f: ReleaseTypeFilter) => {
    setActiveFilter(f)
  }

  return (
    <>
      {!isFancy ? (
        <ReleasesSection
          releases={releases}
          columns={releaseColumns}
          cardVariant={releaseCardVariant}
          hoverEffect={releaseHoverEffect}
          onReleaseClick={(release) => {
            const selected = releases.find((item) => item.id === release.id)
            if (!selected?.overlayRelease?.id) return
            handleReleaseClick(selected)
          }}
        />
      ) : (
        <SectionWrapper id="releases" data-theme-color="foreground card border primary">
          <SectionHeading dataText="RELEASES">RELEASES</SectionHeading>
            <div className="mb-6 flex flex-wrap gap-2">
              {RELEASE_TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value || 'all'}
                  type="button"
                  onClick={() => handleFilter(filter.value)}
                  className={`min-h-[44px] border px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
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
            ) : releaseLayout === 'swipe' ? (
              <ReleasesSwipeLayout releases={layoutReleases} renderCard={renderLayoutCard} />
            ) : (
              <Releases3DCarouselLayout releases={layoutReleases} renderCard={renderLayoutCard} />
            )}
        </SectionWrapper>
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
