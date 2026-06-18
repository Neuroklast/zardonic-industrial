import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BackgroundStack } from '@/app/_components/public/BackgroundStack'

describe('public BackgroundStack', () => {
  const originalInnerHeight = window.innerHeight
  const originalScrollY = window.scrollY
  const originalScrollHeight = document.documentElement.scrollHeight

  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 3000 })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: originalScrollY })
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: originalScrollHeight })
    vi.restoreAllMocks()
  })

  it('renders a muted inline video without autoplay or loop', () => {
    const { container } = render(
      <BackgroundStack
        videoUrl="https://example.com/bg.mp4"
        backgroundType="minimal"
      />,
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
      <BackgroundStack
        videoUrl="https://example.com/bg.mp4"
        backgroundType="minimal"
      />,
    )

    const video = container.querySelector('video') as HTMLVideoElement
    Object.defineProperty(video, 'duration', { configurable: true, value: 120 })
    video.currentTime = 0

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 })
    fireEvent.scroll(window)

    expect(video.currentTime).toBe(30)
  })
})
