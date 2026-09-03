import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

vi.mock('@/components/CyberpunkOverlay', () => ({
  default: ({ overlay }: { overlay: { type?: string } | null }) => (
    <div data-testid="browse-overlay">{overlay?.type ?? 'none'}</div>
  ),
}))

vi.mock('@/components/releases/ReleasesSwipeLayout', () => ({
  ReleasesSwipeLayout: () => <div data-testid="releases-swipe-layout" />,
}))

import { LocaleProvider } from '@/contexts/LocaleContext'
import { GigsBrowseClient } from '@/app/_components/public/GigsBrowseClient'
import { ReleasesBrowseClient } from '@/app/_components/public/ReleasesBrowseClient'
import { GigsSection } from '@/app/_components/public/GigsSection'
import type { PublicGigRow } from '@/lib/gig-public-mapper'
import type { PublicReleaseCardItem } from '@/lib/public-fetch'

function renderWithLocale(ui: ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>)
}

const root = resolve(import.meta.dirname, '../..')

function readSource(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

function makeOverlayRelease(id: string, title: string) {
  return {
    id,
    title,
    artwork: '',
    year: '2026',
    streamingLinks: [],
    type: 'album' as const,
  }
}

beforeAll(() => {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null
    readonly rootMargin = '0px'
    readonly thresholds = [0]

    disconnect() {}
    observe() {}
    takeRecords() {
      return []
    }
    unobserve() {}
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  })
})

describe('public browse pages', () => {
  it('exposes dedicated /releases, /gigs and /media routes', () => {
    expect(readSource('app/releases/page.tsx')).toMatch(/ReleasesBrowseClient/)
    expect(readSource('app/gigs/page.tsx')).toMatch(/GigsBrowseClient/)
    expect(readSource('app/media/page.tsx')).toMatch(/MediaBrowseClient/)
  })

  it('uses swipe layout on mobile and grid on desktop for releases browse', () => {
    const src = readSource('app/_components/public/ReleasesBrowseClient.tsx')
    expect(src).toMatch(/ReleasesSwipeLayout/)
    expect(src).toMatch(/md:hidden/)
    expect(src).toMatch(/hidden gap-6 md:grid/)
  })

  it('filters and paginates releases on the browse client', () => {
    const releases: PublicReleaseCardItem[] = Array.from({ length: 14 }, (_, index) => ({
      id: `release-${index}`,
      title: index % 2 === 0 ? `Album ${index}` : `EP ${index}`,
      type: index % 2 === 0 ? 'album' : 'ep',
      release_date: `202${index % 10}-01-01`,
      coverUrl: null,
      streamingLinks: [],
      overlayRelease: makeOverlayRelease(`release-${index}`, `Release ${index}`),
    }))

    render(<ReleasesBrowseClient releases={releases} />)

    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'EP 3' } })
    expect(screen.getByText(/\/\/ 1 result/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    fireEvent.click(screen.getByRole('button', { name: /^single \/ ep$/i }))
    expect(screen.getByText(/\/\/ 7 results/i)).toBeInTheDocument()
  })

  it('filters gigs and opens overlay from browse client', () => {
    const gigs: PublicGigRow[] = [
      {
        id: 'gig-upcoming',
        title: 'Berlin Night',
        venue: 'Club',
        city: 'Berlin',
        country: 'Germany',
        event_date: '2030-01-01',
        ticket_url: null,
        festival_name: null,
      },
      {
        id: 'gig-past',
        title: 'Madrid Show',
        venue: 'Arena',
        city: 'Madrid',
        country: 'Spain',
        event_date: '2020-01-01',
        ticket_url: null,
        festival_name: null,
      },
    ]

    render(<GigsBrowseClient gigs={gigs} />)

    fireEvent.click(screen.getByRole('button', { name: /^past$/i }))
    fireEvent.click(screen.getByRole('button', { name: /open event details for madrid show/i }))
    expect(screen.getByTestId('browse-overlay')).toHaveTextContent('gig')
  })

  it('links homepage gigs section to /gigs when more events exist', () => {
    const upcoming = Array.from({ length: 4 }, (_, index) => ({
      id: `upcoming-${index}`,
      title: `Upcoming ${index}`,
      venue: 'Club',
      city: 'Berlin',
      country: 'Germany',
      event_date: '2030-01-01',
      ticket_url: null,
      festival_name: null,
    }))

    renderWithLocale(<GigsSection upcoming={upcoming} past={[]} />)
    expect(screen.getByRole('link', { name: /view all events/i })).toHaveAttribute('href', '/gigs')
  })

  it('hides past gigs on the homepage when none are upcoming', () => {
    const past: PublicGigRow[] = [
      {
        id: 'gig-past',
        title: 'Madrid Show',
        venue: 'Arena',
        city: 'Madrid',
        country: 'Spain',
        event_date: '2020-01-01',
        ticket_url: null,
        festival_name: null,
      },
    ]

    renderWithLocale(<GigsSection upcoming={[]} past={past} />)
    expect(screen.getByText(/no upcoming events/i)).toBeInTheDocument()
    expect(screen.queryByText(/madrid show/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view all events/i })).toHaveAttribute('href', '/gigs')
  })
})