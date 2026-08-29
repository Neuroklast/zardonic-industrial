import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { BioSection } from '@/app/_components/public/BioSection'
import { CreditsSection } from '@/app/_components/public/CreditsSection'
import { GallerySection } from '@/app/_components/public/GallerySection'
import { GigsSection } from '@/app/_components/public/GigsSection'
import { MerchandiseSection } from '@/app/_components/public/MerchandiseSection'
import { MusicHighlightsSection } from '@/app/_components/public/MusicHighlightsSection'
import { ReleasesSection } from '@/app/_components/public/ReleasesSection'
import { SoundpacksSection } from '@/app/_components/public/SoundpacksSection'
import { MediaSection } from '@/app/_components/public/MediaSection'

function renderWithLocale(ui: ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>)
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
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  })
})

describe('public section empty states', () => {
  it('keeps the bio section visible when biography content is empty', () => {
    renderWithLocale(<BioSection content="" />)

    expect(screen.getByRole('heading', { name: /^biography/i })).toBeInTheDocument()
    expect(screen.getByText(/biography coming soon/i)).toBeInTheDocument()
  })

  it('does not crash when bio content is null or undefined', () => {
    const { unmount } = renderWithLocale(<BioSection content={null} />)
    expect(screen.getByText(/biography coming soon/i)).toBeInTheDocument()
    unmount()

    renderWithLocale(<BioSection content={undefined} />)
    expect(screen.getByText(/biography coming soon/i)).toBeInTheDocument()
  })

  it('does not crash when bio content is a non-string (malformed data)', () => {
    // Runtime/API shape guards — TypeScript allows only string|null|undefined, but
    // clients can still receive bad serialized data from cache/import paths.
    renderWithLocale(
      <BioSection content={{ story: 'x' } as unknown as string} />,
    )
    expect(screen.getByText(/biography coming soon/i)).toBeInTheDocument()
  })

  it('keeps content sections visible with empty placeholder states', () => {
    renderWithLocale(
      <>
        <CreditsSection credits={[]} endorsements={[]} />
        <GallerySection items={[]} />
        <MusicHighlightsSection highlights={[]} />
        <ReleasesSection releases={[]} />
        <GigsSection upcoming={[]} past={[]} />
        <MerchandiseSection items={[]} footerText="" />
        <SoundpacksSection items={[]} />
        <MediaSection items={[]} />
      </>,
    )

    expect(screen.getByText(/credits coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/gallery coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/music highlights coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/releases coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/no upcoming events/i)).toBeInTheDocument()
    expect(screen.getByText(/merchandise coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/soundpacks coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/downloads coming soon/i)).toBeInTheDocument()
  })
})
