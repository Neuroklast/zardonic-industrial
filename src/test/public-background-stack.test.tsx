import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BackgroundStack } from '@/app/_components/public/BackgroundStack'

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn().mockReturnValue(false),
}))

vi.mock('@/contexts/LenisContext', () => ({
  useLenisContext: () => ({
    lenis: null,
    scrollTo: vi.fn(),
    scrollY: 0,
    velocityY: 0,
    getScrollY: () => 0,
    getVelocityY: () => 0,
    isLiteMode: true,
  }),
}))

import { useIsMobile } from '@/hooks/use-mobile'

describe('public BackgroundStack', () => {
  const originalInnerHeight = window.innerHeight
  const originalScrollY = window.scrollY
  const originalScrollHeight = document.documentElement.scrollHeight

  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false)
    vi.useFakeTimers()
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    })
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      return window.setTimeout(() => callback(0), 0)
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((handle: number) => {
      window.clearTimeout(handle)
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: originalScrollY })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: originalScrollHeight,
    })
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders a muted inline video without autoplay or loop', () => {
    const { container } = render(
      <BackgroundStack videoUrl="https://example.com/bg.mp4" backgroundType="minimal" />,
    )

    const video = container.querySelector('video') as HTMLVideoElement
    expect(video).toBeTruthy()
    expect(video.autoplay).toBe(false)
    expect(video.loop).toBe(false)
    expect(video.muted).toBe(true)
    expect(video.playsInline).toBe(true)
    expect(video.preload).toBe('auto')
  })

  it('scrubs video currentTime from page scroll progress', () => {
    const { container } = render(
      <BackgroundStack videoUrl="https://example.com/bg.mp4" backgroundType="minimal" />,
    )

    const video = container.querySelector('video') as HTMLVideoElement
    let currentTime = 0
    Object.defineProperty(video, 'duration', { configurable: true, value: 120 })
    Object.defineProperty(video, 'readyState', { configurable: true, value: 4 })
    Object.defineProperty(video, 'currentTime', {
      configurable: true,
      get: () => currentTime,
      set: (value: number) => {
        currentTime = value
        // attachScrollVideoSync waits for seeked when seeking
        video.dispatchEvent(new Event('seeked'))
      },
    })

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 })
    fireEvent.scroll(window)
    act(() => {
      vi.runAllTimers()
    })

    // progress = 500 / (3000-1000) = 0.25 → 30s
    expect(currentTime).toBe(30)
  })

  it('applies configurable video opacity to the video wrapper', () => {
    const { container } = render(
      <BackgroundStack
        videoUrl="https://example.com/bg.mp4"
        videoOpacity={0.35}
        backgroundType="minimal"
      />,
    )

    const wrap = container.querySelector('[data-draft-target="bg-video-wrap"]') as HTMLElement
    expect(wrap.style.opacity).toBe('0.35')
  })

  it('hides video on mobile when mobileVideoMode is off', () => {
    vi.mocked(useIsMobile).mockReturnValue(true)

    const { container } = render(
      <BackgroundStack
        videoUrl="https://example.com/bg.mp4"
        mobileVideoMode="off"
        backgroundType="minimal"
      />,
    )

    expect(container.querySelector('video')).toBeNull()
  })

  it('uses mobile video url when mode is separate on mobile', () => {
    vi.mocked(useIsMobile).mockReturnValue(true)

    const { container } = render(
      <BackgroundStack
        videoUrl="https://example.com/desktop.mp4"
        mobileVideoUrl="https://example.com/mobile.mp4"
        mobileVideoMode="separate"
        backgroundType="minimal"
      />,
    )

    const source = container.querySelector('video source') as HTMLSourceElement
    expect(source.src).toContain('mobile.mp4')
  })
})
