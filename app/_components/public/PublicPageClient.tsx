'use client'

import { useState, useMemo } from 'react'
import { m } from 'framer-motion'
import CyberpunkOverlay from '@/components/CyberpunkOverlay'
import type { CyberpunkOverlayState, Release } from '@/lib/app-types'
import { ReleasesSection } from './ReleasesSection'
import { ReleasesSwipeLayout } from '@/components/releases/ReleasesSwipeLayout'
import { Releases3DCarouselLayout } from '@/components/releases/Releases3DCarouselLayout'
import { SectionWrapper, SectionEmpty } from './SectionWrapper'

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
  if (['album', 'ep', 'single', 'remix', 'compilation'].includes(normalized)) {
    return normalized as ReleaseFilter
  }
  return ''
}

function mapToLayoutRelease(item: PublicReleaseCardItem): Release {
  const artwork = item.coverUrl ?? ''
  const streamingLinksArr = (item.streamingLinks || []).map((l) => ({ platform: l.platform, url: l.url }))
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    releaseDate: item.release_date ?? undefined,
    year: item.release_date ? new Date(item.release_date).getFullYear().toString() : undefined,
    artwork,
    cover: artwork,
    streamingLinks: streamingLinksArr,
    description: undefined,
    featured: false,
    tracks: [],
    customLinks: undefined,
    manuallyEdited: !!item.manually_edited,
  }
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
  const [activeFilter, setActiveFilter] = useState<ReleaseFilter>('')

  const handleReleaseClick = (item: PublicReleaseCardItem) => {
    setOverlay({ type: 'release', data: item.overlayRelease })
  }

  const isFancy = releaseLayout === 'swipe' || releaseLayout === 'carousel-3d'

  // For fancy layouts (and potential future), compute filtered list
  const filteredReleases = useMemo(() => {
    const sorted = [...releases].sort((left, right) => {
      const leftTime = left.release_date ? new Date(left.release_date).getTime() : 0
      const rightTime = right.release_date ? new Date(right.release_date).getTime() : 0
      return rightTime - leftTime
    })
    if (!activeFilter) return sorted
    return sorted.filter((release) => normalizeType(release.type) === activeFilter)
  }, [activeFilter, releases])

  const layoutReleases = filteredReleases.map(mapToLayoutRelease)

  const renderLayoutCard = (rel: Release, index: number) => {
    const item = filteredReleases[index] || filteredReleases.find(r => r.id === rel.id)
    if (!item) return null
    return <PublicReleaseCard item={item} onClick={() => handleReleaseClick(item)} />
  }

  const handleFilter = (f: ReleaseFilter) => {
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
            if (!selected) return
            setOverlay({ type: 'release', data: selected.overlayRelease })
          }}
        />
      ) : (
        <SectionWrapper id="releases" data-theme-color="foreground card border primary">
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
                  onClick={() => handleFilter(filter.value)}
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
              <SectionEmpty label="Releases coming soon" />
            ) : releaseLayout === 'swipe' ? (
              <ReleasesSwipeLayout releases={layoutReleases} renderCard={renderLayoutCard} />
            ) : (
              <Releases3DCarouselLayout releases={layoutReleases} renderCard={renderLayoutCard} />
            )}
          </div>
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
