/**
 * High-performance scroll → video.currentTime scrubbing.
 * Single rAF, seek coalescing, optional fastSeek, Lenis or window scroll.
 */

export type ScrollVideoSyncOptions = {
  video: HTMLVideoElement
  /** Prefer Lenis instance when available */
  lenis?: { on: (e: 'scroll', cb: (s: { scroll: number }) => void) => void; off: (e: 'scroll', cb: (s: { scroll: number }) => void) => void; scroll?: number } | null
  /** Min time delta (seconds) before seeking again */
  minDeltaSec?: number
}

export function attachScrollVideoSync({
  video,
  lenis = null,
  minDeltaSec = 1 / 45,
}: ScrollVideoSyncOptions): () => void {
  let raf = 0
  let seeking = false
  let targetProgress = 0
  let lastApplied = -1
  let destroyed = false

  const readScrollY = () => {
    if (lenis && typeof lenis.scroll === 'number') return lenis.scroll
    return window.scrollY || document.documentElement.scrollTop || 0
  }

  const progressFromScroll = (scrollY: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (max <= 0) return 0
    return Math.min(1, Math.max(0, scrollY / max))
  }

  const apply = () => {
    raf = 0
    if (destroyed || seeking || document.hidden) return
    const duration = video.duration
    if (!Number.isFinite(duration) || duration <= 0) return
    if (video.readyState < 2) return // HAVE_CURRENT_DATA

    const t = targetProgress * duration
    if (Math.abs(t - lastApplied) < minDeltaSec) return
    if (Math.abs(video.currentTime - t) < minDeltaSec) return

    seeking = true
    lastApplied = t

    const done = () => {
      seeking = false
      video.removeEventListener('seeked', done)
    }
    video.addEventListener('seeked', done)

    try {
      const v = video as HTMLVideoElement & { fastSeek?: (time: number) => void }
      if (typeof v.fastSeek === 'function') {
        v.fastSeek(t)
      } else {
        video.currentTime = t
      }
    } catch {
      seeking = false
      video.removeEventListener('seeked', done)
    }
  }

  const schedule = (scrollY?: number) => {
    targetProgress = progressFromScroll(scrollY ?? readScrollY())
    if (!raf) raf = requestAnimationFrame(apply)
  }

  const onLenisScroll = (state: { scroll: number }) => {
    schedule(state.scroll)
  }

  const onWindowScroll = () => {
    schedule()
  }

  const onMeta = () => schedule()
  const onVis = () => {
    if (!document.hidden) schedule()
  }

  video.addEventListener('loadedmetadata', onMeta)
  video.addEventListener('loadeddata', onMeta)
  document.addEventListener('visibilitychange', onVis)

  if (lenis) {
    lenis.on('scroll', onLenisScroll)
  } else {
    window.addEventListener('scroll', onWindowScroll, { passive: true })
  }

  // Initial frame
  schedule()

  return () => {
    destroyed = true
    if (raf) cancelAnimationFrame(raf)
    video.removeEventListener('loadedmetadata', onMeta)
    video.removeEventListener('loadeddata', onMeta)
    document.removeEventListener('visibilitychange', onVis)
    if (lenis) {
      lenis.off('scroll', onLenisScroll)
    } else {
      window.removeEventListener('scroll', onWindowScroll)
    }
  }
}
