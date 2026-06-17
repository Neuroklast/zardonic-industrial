import { useState, useEffect } from 'react'
import { cacheImage } from '@/lib/image-cache'
import type { LoadingScreenMode } from '@/lib/types'

interface UseLoaderProgressOptions {
  precacheUrls?: string[]
  mode?: LoadingScreenMode
  duration?: number
  onLoadComplete: () => void
  /** Delay (ms) before firing `onLoadComplete` once progress hits 100. Defaults to 800. */
  completeDelay?: number
}

interface UseLoaderProgressResult {
  /** Integer 0–100 */
  progress: number
}

/**
 * Shared loading-progress hook used by `GlitchDecodeLoader` and
 * `MinimalBarLoader`. Manages:
 *   - progress counter (timed or organic)
 *   - background image pre-caching
 *   - completion callback with a configurable delay
 */
export function useLoaderProgress({
  precacheUrls = [],
  mode = 'real',
  duration = 3,
  onLoadComplete,
  completeDelay = 800,
}: UseLoaderProgressOptions): UseLoaderProgressResult {
  const [progress, setProgress] = useState(0)
  const [cachingDone, setCachingDone] = useState(precacheUrls.length === 0)

  // ── Progress counter ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'timed') {
      const totalMs = (duration ?? 3) * 1000
      const intervalMs = 50
      const increment = 100 / (totalMs / intervalMs)
      const id = setInterval(() => setProgress(p => Math.min(p + increment, 100)), intervalMs)
      return () => clearInterval(id)
    }
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 95) return p
        return Math.min(p + (p < 50 ? 3 : p < 80 ? 1.5 : 0.5), 95)
      })
    }, 100)
    return () => clearInterval(id)
  }, [mode, duration])

  // ── Image pre-caching ────────────────────────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (precacheUrls.length === 0) { setCachingDone(true); return }
    setCachingDone(false)
    let cancelled = false
    Promise.allSettled(precacheUrls.map(url => cacheImage(url)))
      .then(() => { if (!cancelled) setCachingDone(true) })
    return () => { cancelled = true }
  }, [precacheUrls])

  // ── Push to 100 when caching finishes near the end ────────────────────────
  useEffect(() => {
    if (mode === 'timed') return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cachingDone && progress >= 90) setProgress(100)
  }, [cachingDone, progress, mode])

  // ── Completion ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (progress >= 100 && (mode === 'timed' || cachingDone)) {
      const t = setTimeout(() => onLoadComplete(), completeDelay)
      return () => clearTimeout(t)
    }
  }, [progress, cachingDone, mode, onLoadComplete, completeDelay])

  return { progress }
}
