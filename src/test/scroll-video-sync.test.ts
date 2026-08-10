import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { attachScrollVideoSync } from '@/lib/scroll-video-sync'

function mockVideo(overrides: Partial<HTMLVideoElement> = {}): HTMLVideoElement {
  const listeners = new Map<string, Set<EventListener>>()
  let currentTime = 0
  const video = {
    duration: 10,
    readyState: 4,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    get currentTime() {
      return currentTime
    },
    set currentTime(value: number) {
      currentTime = value
      // Real browsers fire seeked after a successful seek
      queueMicrotask(() => {
        listeners.get('seeked')?.forEach((cb) => cb(new Event('seeked')))
      })
    },
    addEventListener: (type: string, cb: EventListener) => {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)!.add(cb)
    },
    removeEventListener: (type: string, cb: EventListener) => {
      listeners.get(type)?.delete(cb)
    },
    ...overrides,
  } as unknown as HTMLVideoElement

  // Expose for tests
  ;(video as unknown as { __emit: (t: string) => void }).__emit = (t: string) => {
    listeners.get(t)?.forEach((cb) => cb(new Event(t)))
  }
  return video
}

describe('attachScrollVideoSync', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback) => {
        cb(0)
        return 1
      },
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 750, writable: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('seeks video currentTime from scroll progress', () => {
    const video = mockVideo()
    const detach = attachScrollVideoSync({ video, minDeltaSec: 0.01 })
    // progress = 750 / 1500 = 0.5 → t = 5
    expect(video.currentTime).toBeCloseTo(5, 1)
    detach()
  })

  it('uses live Lenis getProgress / getScroll (not a frozen mount number)', async () => {
    vi.useFakeTimers()
    try {
      const video = mockVideo()
      let scroll = 0
      let progress = 0
      const listeners = new Set<(s: { scroll: number; progress?: number }) => void>()
      const detach = attachScrollVideoSync({
        video,
        minDeltaSec: 0.01,
        lenis: {
          on: (_e, cb) => {
            listeners.add(cb)
          },
          off: (_e, cb) => {
            listeners.delete(cb)
          },
          getScroll: () => scroll,
          getProgress: () => progress,
        },
      })

      // Initial: progress 0
      expect(video.currentTime).toBeCloseTo(0, 1)
      await vi.advanceTimersByTimeAsync(150) // seek timeout / seeked

      progress = 0.5
      scroll = 750
      listeners.forEach((cb) => cb({ scroll, progress }))
      await vi.advanceTimersByTimeAsync(150)
      expect(video.currentTime).toBeCloseTo(5, 1)

      progress = 1
      listeners.forEach((cb) => cb({ scroll: 1500, progress }))
      await vi.advanceTimersByTimeAsync(150)
      expect(video.currentTime).toBeCloseTo(10, 1)

      detach()
    } finally {
      vi.useRealTimers()
    }
  })

  it('detach removes scroll listener without throwing', () => {
    const video = mockVideo()
    const detach = attachScrollVideoSync({ video })
    expect(() => detach()).not.toThrow()
  })
})
