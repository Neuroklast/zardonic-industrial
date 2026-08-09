import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { attachScrollVideoSync } from '@/lib/scroll-video-sync'

function mockVideo(overrides: Partial<HTMLVideoElement> = {}): HTMLVideoElement {
  const listeners = new Map<string, Set<EventListener>>()
  const video = {
    duration: 10,
    currentTime: 0,
    readyState: 4,
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

  it('detach removes scroll listener without throwing', () => {
    const video = mockVideo()
    const detach = attachScrollVideoSync({ video })
    expect(() => detach()).not.toThrow()
  })
})
