import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { PublicPageClient } from '@/app/_components/public/PublicPageClient'

vi.mock('@/components/CyberpunkOverlay', () => ({
  default: ({ overlay }: { overlay: { type?: string } | null }) => (
    <div data-testid="overlay-state">{overlay?.type ?? 'none'}</div>
  ),
}))

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

describe('PublicPageClient', () => {
  it('opens release overlay state on release card click', () => {
    render(
      <PublicPageClient
        releases={[
          {
            id: 'release-1',
            title: 'Release One',
            type: 'single',
            release_date: '2026-01-01',
            coverUrl: null,
            streamingLinks: [],
            overlayRelease: {
              id: 'release-1',
              title: 'Release One',
              artwork: '',
              year: '2026',
              releaseDate: '2026-01-01',
              streamingLinks: [],
              type: 'single',
            },
          },
        ]}
      />,
    )

    expect(screen.getByTestId('overlay-state')).toHaveTextContent('none')
    fireEvent.click(screen.getByRole('button', { name: /open release details for release one/i }))
    expect(screen.getByTestId('overlay-state')).toHaveTextContent('release')
  })
})
