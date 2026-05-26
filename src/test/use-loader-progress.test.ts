import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLoaderProgress } from '@/hooks/use-loader-progress'

const { mockCacheImage } = vi.hoisted(() => ({ mockCacheImage: vi.fn() }))
vi.mock('@/lib/image-cache', () => ({ cacheImage: mockCacheImage }))

describe('useLoaderProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockCacheImage.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('starts at 0 progress', () => {
    const { result } = renderHook(() => useLoaderProgress({ onLoadComplete: vi.fn() }))
    expect(result.current.progress).toBe(0)
  })

  it('increments progress over time in real mode', () => {
    const { result } = renderHook(() => useLoaderProgress({ onLoadComplete: vi.fn() }))
    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current.progress).toBeGreaterThan(0)
  })

  it('caps organic progress at 95 while caching is still pending', () => {
    mockCacheImage.mockReturnValue(new Promise(() => {})) // never resolves → cachingDone stays false
    const { result } = renderHook(() =>
      useLoaderProgress({ precacheUrls: ['/img/a.jpg'], onLoadComplete: vi.fn() })
    )
    act(() => { vi.advanceTimersByTime(30_000) })
    expect(result.current.progress).toBeLessThanOrEqual(95)
  })

  it('calls onLoadComplete in timed mode after duration + delay elapse', () => {
    const onLoadComplete = vi.fn()
    renderHook(() =>
      useLoaderProgress({ mode: 'timed', duration: 1, onLoadComplete, completeDelay: 200 })
    )
    act(() => { vi.advanceTimersByTime(1_000) })
    expect(onLoadComplete).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(200) })
    expect(onLoadComplete).toHaveBeenCalledTimes(1)
  })

  it('uses the provided completeDelay before firing onLoadComplete', () => {
    const onLoadComplete = vi.fn()
    renderHook(() =>
      useLoaderProgress({ mode: 'timed', duration: 1, onLoadComplete, completeDelay: 600 })
    )
    act(() => { vi.advanceTimersByTime(1_000) })
    expect(onLoadComplete).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(600) })
    expect(onLoadComplete).toHaveBeenCalledTimes(1)
  })

  it('precaches all provided URLs on mount', () => {
    mockCacheImage.mockReturnValue(new Promise(() => {})) // keep pending, avoid completion side-effects
    const urls = ['/img/a.jpg', '/img/b.jpg']
    renderHook(() =>
      useLoaderProgress({ precacheUrls: urls, mode: 'timed', duration: 1, onLoadComplete: vi.fn() })
    )
    expect(mockCacheImage).toHaveBeenCalledWith('/img/a.jpg')
    expect(mockCacheImage).toHaveBeenCalledWith('/img/b.jpg')
    expect(mockCacheImage).toHaveBeenCalledTimes(2)
  })

  it('does not call onLoadComplete before progress reaches 100', () => {
    const onLoadComplete = vi.fn()
    renderHook(() =>
      useLoaderProgress({ mode: 'timed', duration: 5, onLoadComplete, completeDelay: 0 })
    )
    act(() => { vi.advanceTimersByTime(100) })
    expect(onLoadComplete).not.toHaveBeenCalled()
  })

  it('re-runs caching when precacheUrls reference changes', () => {
    mockCacheImage.mockReturnValue(new Promise(() => {}))
    const urls1 = ['/img/a.jpg']
    const urls2 = ['/img/b.jpg']
    const { rerender } = renderHook(
      ({ urls }: { urls: string[] }) =>
        useLoaderProgress({ precacheUrls: urls, onLoadComplete: vi.fn() }),
      { initialProps: { urls: urls1 } }
    )
    expect(mockCacheImage).toHaveBeenCalledTimes(1)
    rerender({ urls: urls2 })
    expect(mockCacheImage).toHaveBeenCalledTimes(2)
    expect(mockCacheImage).toHaveBeenLastCalledWith('/img/b.jpg')
  })
})
