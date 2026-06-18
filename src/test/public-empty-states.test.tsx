import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { BioSection } from '@/app/_components/public/BioSection'
import { CreditsSection } from '@/app/_components/public/CreditsSection'
import { GallerySection } from '@/app/_components/public/GallerySection'
import { GigsSection } from '@/app/_components/public/GigsSection'
import { MusicHighlightsSection } from '@/app/_components/public/MusicHighlightsSection'
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

describe('public section empty states', () => {
  it('keeps the bio section visible when biography content is empty', () => {
    render(<BioSection content="" />)

    expect(screen.getByRole('heading', { name: /^biography/i })).toBeInTheDocument()
    expect(screen.getByText(/biography coming soon/i)).toBeInTheDocument()
  })

  it('keeps content sections visible with empty placeholder states', () => {
    render(
      <>
        <CreditsSection credits={[]} endorsements={[]} />
        <GallerySection items={[]} />
        <MusicHighlightsSection highlights={[]} />
        <ReleasesSection releases={[]} />
        <GigsSection upcoming={[]} past={[]} />
      </>,
    )

    expect(screen.getByText(/credits and endorsements coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/gallery coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/music highlights coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/releases coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/tour dates coming soon/i)).toBeInTheDocument()
  })
})
