import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import GallerySection from '@/components/GallerySection'
import type { SiteData } from '@/lib/app-types'

function makeSiteData(overrides: Partial<SiteData> = {}): SiteData {
  return {
    artistName: 'Zardonic',
    heroImage: '',
    bio: '',
    tracks: [],
    gigs: [],
    releases: [],
    gallery: [],
    instagramFeed: [],
    members: [],
    mediaFiles: [],
    creditHighlights: [],
    social: {},
    ...overrides,
  }
}

describe('GallerySection', () => {
  beforeEach(() => {
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  })

  it('opens external links for linked gallery images', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const setGalleryIndex = vi.fn()

    render(
      <GallerySection
        siteData={makeSiteData({
          gallery: [{ url: 'https://images.example.com/photo.jpg', linkUrl: 'https://store.example.com/item' }],
        })}
        editMode={false}
        sectionOrder={0}
        visible
        sectionLabel="Gallery"
        setGalleryIndex={setGalleryIndex}
        adminSettings={undefined}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /open external link for gallery image 1/i }))

    expect(openSpy).toHaveBeenCalledWith('https://store.example.com/item', '_blank', 'noopener,noreferrer')
    expect(setGalleryIndex).not.toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it('still opens the lightbox for legacy string gallery entries', () => {
    const setGalleryIndex = vi.fn()

    render(
      <GallerySection
        siteData={makeSiteData({
          gallery: ['https://images.example.com/photo.jpg'],
        })}
        editMode={false}
        sectionOrder={0}
        visible
        sectionLabel="Gallery"
        setGalleryIndex={setGalleryIndex}
        adminSettings={undefined}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /open gallery image 1/i }))

    expect(setGalleryIndex).toHaveBeenCalledWith(0)
  })
})
