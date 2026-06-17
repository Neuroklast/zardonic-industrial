/**
 * Unit tests for SiteBackground component – image and video background variants.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { SiteBackground } from '@/app/_components/public/SiteBackground'

// next/image is a complex component; stub it so tests run in jsdom
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    const { fill: _fill, priority: _p, quality: _q, sizes: _s, ...rest } = props
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />
  },
}))

describe('SiteBackground', () => {
  it('renders the background image', () => {
    const { container } = render(
      <SiteBackground imageUrl="/bg.jpg" alt="Background test" />,
    )
    const img = container.querySelector('img[alt="Background test"]')
    expect(img).toBeTruthy()
  })

  it('does NOT render a video element when videoUrl is not provided', () => {
    const { container } = render(<SiteBackground imageUrl="/bg.jpg" />)
    expect(container.querySelector('video')).toBeNull()
  })

  it('renders a video element when videoUrl is provided', () => {
    const { container } = render(
      <SiteBackground imageUrl="/bg.jpg" videoUrl="https://example.com/bg.mp4" />,
    )
    const video = container.querySelector('video')
    expect(video).toBeTruthy()
    expect(video?.querySelector('source')?.getAttribute('src')).toBe('https://example.com/bg.mp4')
  })

  it('video element is autoplay, muted, loop, playsInline', () => {
    const { container } = render(
      <SiteBackground imageUrl="/bg.jpg" videoUrl="https://example.com/bg.mp4" />,
    )
    const video = container.querySelector('video') as HTMLVideoElement
    expect(video.autoplay).toBe(true)
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
  })

  it('video poster is the imageUrl', () => {
    const { container } = render(
      <SiteBackground imageUrl="/poster.jpg" videoUrl="https://example.com/bg.mp4" />,
    )
    const video = container.querySelector('video') as HTMLVideoElement
    // jsdom resolves relative URLs, so check via attribute not property
    expect(video.getAttribute('poster')).toBe('/poster.jpg')
  })

  it('does NOT render video when videoUrl is null', () => {
    const { container } = render(<SiteBackground imageUrl="/bg.jpg" videoUrl={null} />)
    expect(container.querySelector('video')).toBeNull()
  })

  it('renders CRT scanline overlay', () => {
    const { container } = render(<SiteBackground imageUrl="/bg.jpg" />)
    expect(container.querySelector('.scanline-layer')).toBeTruthy()
  })

  it('container is fixed and pointer-events-none', () => {
    const { container } = render(<SiteBackground imageUrl="/bg.jpg" />)
    const outer = container.firstElementChild as HTMLElement
    expect(outer.classList.contains('fixed')).toBe(true)
    expect(outer.classList.contains('pointer-events-none')).toBe(true)
  })
})
