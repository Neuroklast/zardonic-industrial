import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import VideoBackground from '@/components/VideoBackground'

// Mock device-capability so we can control lite-mode in tests
vi.mock('@/lib/device-capability', () => ({
  shouldUseLiteMode: vi.fn().mockReturnValue(false),
}))

// Mock image-cache to return the URL unchanged
vi.mock('@/lib/image-cache', () => ({
  toDirectImageUrl: (url: string) => url,
}))

import { shouldUseLiteMode } from '@/lib/device-capability'

describe('VideoBackground — capable device', () => {
  beforeEach(() => {
    vi.mocked(shouldUseLiteMode).mockReturnValue(false)
  })

  it('renders a <video> element by default', () => {
    const { container } = render(
      <VideoBackground videoUrl="https://example.com/bg.mp4" />
    )
    const video = container.querySelector('video')
    expect(video).not.toBeNull()
  })

  it('sets autoPlay, muted, loop, playsInline on the video', () => {
    const { container } = render(
      <VideoBackground videoUrl="https://example.com/bg.mp4" />
    )
    const video = container.querySelector('video') as HTMLVideoElement
    expect(video.autoplay).toBe(true)
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.playsInline).toBe(true)
  })

  it('sets poster when fallbackImageUrl is provided', () => {
    const { container } = render(
      <VideoBackground
        videoUrl="https://example.com/bg.mp4"
        fallbackImageUrl="https://example.com/poster.jpg"
      />
    )
    const video = container.querySelector('video') as HTMLVideoElement
    expect(video.poster).toBe('https://example.com/poster.jpg')
  })

  it('is aria-hidden', () => {
    const { container } = render(
      <VideoBackground videoUrl="https://example.com/bg.mp4" />
    )
    const video = container.querySelector('video')
    expect(video?.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('VideoBackground — lite mode device', () => {
  beforeEach(() => {
    vi.mocked(shouldUseLiteMode).mockReturnValue(true)
  })

  it('renders an <img> instead of <video> in lite mode', () => {
    const { container } = render(
      <VideoBackground
        videoUrl="https://example.com/bg.mp4"
        fallbackImageUrl="https://example.com/poster.jpg"
      />
    )
    expect(container.querySelector('video')).toBeNull()
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.src).toContain('poster.jpg')
  })

  it('renders nothing if no fallback image is provided in lite mode', () => {
    const { container } = render(
      <VideoBackground videoUrl="https://example.com/bg.mp4" />
    )
    expect(container.querySelector('video')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.firstChild).toBeNull()
  })

  it('fallback img has aria-hidden', () => {
    const { container } = render(
      <VideoBackground
        videoUrl="https://example.com/bg.mp4"
        fallbackImageUrl="https://example.com/poster.jpg"
      />
    )
    expect(container.querySelector('img')?.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('VideoBackground — opacity prop', () => {
  beforeEach(() => {
    vi.mocked(shouldUseLiteMode).mockReturnValue(false)
  })

  it('applies opacity style to the video element', () => {
    const { container } = render(
      <VideoBackground videoUrl="https://example.com/bg.mp4" opacity={0.5} />
    )
    const video = container.querySelector('video') as HTMLVideoElement
    expect(video.style.opacity).toBe('0.5')
  })
})
