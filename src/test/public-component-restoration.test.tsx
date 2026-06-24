import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('@/components/CyberpunkOverlay', () => ({
  default: ({ overlay }: { overlay: { type?: string } | null }) => (
    <div data-testid="gig-overlay-state">{overlay?.type ?? 'none'}</div>
  ),
}))

import { BioSection } from '@/app/_components/public/BioSection'
import { CreditsSection } from '@/app/_components/public/CreditsSection'
import { GigsSection } from '@/app/_components/public/GigsSection'
import { GlobalEffects } from '@/app/_components/public/GlobalEffects'
import { HeroSection } from '@/app/_components/public/HeroSection'
import { ReleasesSection } from '@/app/_components/public/ReleasesSection'

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
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  })
})

describe('restored public homepage components', () => {
  it('restores the hero glitch logo, overlays, and dual CTAs', () => {
    const { container } = render(
      <>
        <GlobalEffects />
        <HeroSection
          headline="ZARDONIC"
          tagline="Industrial Metal / Drum & Bass"
          ctaLabel="LISTEN NOW"
          ctaUrl="#releases"
          backgroundImageUrl="https://example.com/hero.jpg"
          backgroundImageOpacity={0.4}
        />
      </>,
    )

    expect(container.querySelector('.crt-overlay')).toBeInTheDocument()
    expect(container.querySelector('.noise-effect')).toBeInTheDocument()
    expect(container.querySelector('.hero-logo-glitch')).toBeInTheDocument()
    expect(container.querySelector('.hero-logo-r')).toBeInTheDocument()
    expect(container.querySelector('.hero-logo-b')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /listen now/i })).toHaveAttribute('href', '#releases')
    expect(screen.getByRole('link', { name: /tour dates/i })).toHaveAttribute('href', '#gigs')
    expect(screen.getByRole('link', { name: /listen now/i })).toHaveClass('bg-card/60')
    expect(screen.getByRole('link', { name: /listen now/i })).toHaveClass('text-foreground')
  })

  it('restores the bio expand/collapse mask behaviour', () => {
    render(<BioSection content={'Line one\nLine two\nLine three'} />)

    expect(screen.getByText(/biography/i)).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /read more/i })
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument()
  })

  it('restores release filters and browse-page link', () => {
    const releases = Array.from({ length: 9 }, (_, index) => ({
      id: `release-${index}`,
      title: `Release ${index}`,
      type: index % 2 === 0 ? 'album' : 'ep',
      release_date: `202${index % 10}-01-01`,
      coverUrl: null,
      streamingLinks: [{ platform: 'spotify', url: `https://example.com/${index}` }],
    }))

    const { container } = render(<ReleasesSection releases={releases} />)

    expect(container.querySelectorAll('.cyber-card')).toHaveLength(8)
    expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute('href', '/releases')
    fireEvent.click(screen.getByRole('button', { name: /^ep$/i }))
    expect(screen.getAllByRole('link', { name: /on spotify/i })).toHaveLength(4)
  })

  it('calls release click handler when a release card is selected', () => {
    const onReleaseClick = vi.fn()
    const release = {
      id: 'release-click',
      title: 'Clickable Release',
      type: 'single',
      release_date: '2026-01-01',
      coverUrl: null,
      streamingLinks: [{ platform: 'spotify', url: 'https://example.com/click' }],
    }

    render(<ReleasesSection releases={[release]} onReleaseClick={onReleaseClick} />)

    fireEvent.click(screen.getByRole('button', { name: /open release details for clickable release/i }))
    expect(onReleaseClick).toHaveBeenCalledWith(release)
  })

  it('restores gigs cards and credits logo grids', () => {
    const { container } = render(
      <>
        <GigsSection
          upcoming={[
            {
              id: 'gig-1',
              title: 'Headline Show',
              venue: 'Club X',
              city: 'Berlin',
              country: 'Germany',
              event_date: '2026-08-01',
              ticket_url: 'https://tickets.example.com/1',
              festival_name: null,
            },
          ]}
          past={[
            {
              id: 'gig-2',
              title: 'Past Show',
              venue: 'Arena Y',
              city: 'Madrid',
              country: 'Spain',
              event_date: '2024-08-01',
              ticket_url: null,
              festival_name: 'Festival Y',
            },
          ]}
        />
        <CreditsSection
          credits={[{ id: 'credit-1', name: 'Label', url: null, logoUrl: 'https://example.com/logo-a.png', category: 'credit', logoWhite: true }]}
          endorsements={[{ id: 'endorsement-1', name: 'Brand', url: 'https://example.com', logoUrl: 'https://example.com/logo-b.png', category: 'endorsement', logoWhite: false }]}
        />
      </>,
    )

    expect(screen.getByText(/event\.01082026/i)).toBeInTheDocument()
    expect(screen.getByTestId('gig-overlay-state')).toHaveTextContent('none')
    fireEvent.click(screen.getByRole('button', { name: /open event details for headline show/i }))
    expect(screen.getByTestId('gig-overlay-state')).toHaveTextContent('gig')
    expect(container.querySelector('.scan-line')).toBeInTheDocument()
    expect(container.querySelectorAll('.chromatic-hover')).toHaveLength(1)
    expect(container.querySelectorAll('.logo-white')).toHaveLength(1)
    expect(screen.getByText(/credits/i)).toBeInTheDocument()
    expect(screen.getByText(/endorsements/i)).toBeInTheDocument()
  })
})
