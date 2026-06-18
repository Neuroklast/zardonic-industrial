'use client'

import { useState } from 'react'
import CyberpunkOverlay from '@/components/CyberpunkOverlay'
import type { CyberpunkOverlayState, Release } from '@/lib/app-types'
import { ReleasesSection } from './ReleasesSection'

interface PublicReleaseCardItem {
  id: string
  title: string
  type: string
  release_date: string | null
  coverUrl: string | null
  streamingLinks: Array<{ platform: string; url: string }>
  overlayRelease: Release
}

interface PublicPageClientProps {
  releases: PublicReleaseCardItem[]
  artistName?: string
}

export function PublicPageClient({ releases, artistName = '' }: PublicPageClientProps) {
  const [overlay, setOverlay] = useState<CyberpunkOverlayState | null>(null)

  return (
    <>
      <ReleasesSection
        releases={releases}
        onReleaseClick={(release) => {
          const selected = releases.find((item) => item.id === release.id)
          if (!selected) return
          setOverlay({ type: 'release', data: selected.overlayRelease })
        }}
      />

      <CyberpunkOverlay
        overlay={overlay}
        onClose={() => setOverlay(null)}
        adminSettings={undefined}
        artistName={artistName}
      />
    </>
  )
}
