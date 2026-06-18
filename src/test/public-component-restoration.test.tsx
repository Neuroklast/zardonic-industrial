import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
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
  })

  it('restores the bio expand/collapse mask behaviour', () => {
    render(<BioSection content={'Line one\nLine two\nLine three'} />)

    expect(screen.getByText(/biography/i)).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /read more/i })
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument()
  })

  it('restores release filters and show-all behaviour', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /show all/i }))
    expect(container.querySelectorAll('.cyber-card')).toHaveLength(9)
    fireEvent.click(screen.getByRole('button', { name: /^ep$/i }))
    expect(screen.getAllByRole('link', { name: /on spotify/i })).toHaveLength(4)
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
          credits={[{ id: 'credit-1', name: 'Label', url: null, logoUrl: 'https://example.com/logo-a.png', category: 'credit' }]}
          endorsements={[{ id: 'endorsement-1', name: 'Brand', url: 'https://example.com', logoUrl: 'https://example.com/logo-b.png', category: 'endorsement' }]}
        />
      </>,
    )

    expect(screen.getByText(/event\.01082026/i)).toBeInTheDocument()
    expect(container.querySelector('.scan-line')).toBeInTheDocument()
    expect(container.querySelectorAll('.chromatic-hover')).toHaveLength(2)
    expect(screen.getByText(/credits/i)).toBeInTheDocument()
    expect(screen.getByText(/endorsements/i)).toBeInTheDocument()
  })
})
