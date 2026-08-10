/**
 * High-performance scroll → video.currentTime scrubbing.
 * Single rAF, seek coalescing, optional fastSeek, Lenis or window scroll.
 *
 * Important: Lenis scroll must be read via live getters — never capture
 * `lenis.scroll` as a number at attach time (that freezes scrubbing at frame 0).
 */

export type ScrollVideoLenisAdapter = {
  on: (
    event: 'scroll',
    cb: (state: { scroll: number; progress?: number }) => void,
  ) => void
  off: (
    event: 'scroll',
    cb: (state: { scroll: number; progress?: number }) => void,
  ) => void
  /** Live scroll Y (required for initial frame + visibility resync). */
  getScroll: () => number
  /** Live 0–1 progress when available (preferred over scrollHeight math). */
  getProgress?: () => number
}

export type ScrollVideoSyncOptions = {
  video: HTMLVideoElement
  /** Prefer Lenis instance when available */
  lenis?: ScrollVideoLenisAdapter | null
  /** Min time delta (seconds) before seeking again */
  minDeltaSec?: number
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

export function attachScrollVideoSync({
  video,
  lenis = null,
  minDeltaSec = 1 / 30,
}: ScrollVideoSyncOptions): () => void {
  let raf = 0
  let seeking = false
  let targetProgress = 0
  let lastApplied = -1
  let destroyed = false
  /** While a seek is in flight, keep the latest target and apply once seeked. */
  let pendingAfterSeek = false
  let unlockAttempted = false

  const progressFromDocument = (scrollY: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (max <= 0) return 0
    return clamp01(scrollY / max)
  }

  const readProgress = (scrollYHint?: number) => {
    if (lenis?.getProgress) {
      const p = lenis.getProgress()
      if (Number.isFinite(p)) return clamp01(p)
    }
    const y =
      typeof scrollYHint === 'number'
        ? scrollYHint
        : lenis
          ? lenis.getScroll()
          : window.scrollY || document.documentElement.scrollTop || 0
    return progressFromDocument(y)
  }

  /** Some browsers won't paint seeks until the media element has been “started”. */
  const unlockSeekPaint = () => {
    if (unlockAttempted || destroyed) return
    unlockAttempted = true
    try {
      const playResult = video.play()
      if (playResult && typeof playResult.then === 'function') {
        void playResult
          .then(() => {
            try {
              video.pause()
            } catch {
              /* ignore */
            }
          })
          .catch(() => {
            /* autoplay blocked — seeks may still work once data is buffered */
          })
      } else {
        video.pause()
      }
    } catch {
      /* ignore */
    }
  }

  const apply = () => {
    raf = 0
    if (destroyed || document.hidden) return
    if (seeking) {
      pendingAfterSeek = true
      return
    }
    const duration = video.duration
    if (!Number.isFinite(duration) || duration <= 0) return
    // HAVE_CURRENT_DATA — need a frame to seek to
    if (video.readyState < 2) return

    unlockSeekPaint()

    const t = targetProgress * duration
    if (Math.abs(t - lastApplied) < minDeltaSec) return
    if (Math.abs(video.currentTime - t) < minDeltaSec) return

    seeking = true
    lastApplied = t

    let seekTimeout = 0
    const done = () => {
      if (!seeking) return
      seeking = false
      if (seekTimeout) window.clearTimeout(seekTimeout)
      video.removeEventListener('seeked', done)
      if (pendingAfterSeek && !destroyed) {
        pendingAfterSeek = false
        if (!raf) raf = requestAnimationFrame(apply)
      }
    }
    video.addEventListener('seeked', done)
    // Some environments never fire `seeked` — don't freeze scrubbing forever.
    seekTimeout = window.setTimeout(done, 120)

    try {
      const v = video as HTMLVideoElement & { fastSeek?: (time: number) => void }
      if (typeof v.fastSeek === 'function') {
        v.fastSeek(t)
      } else {
        video.currentTime = t
      }
    } catch {
      done()
    }
  }

  const schedule = (scrollY?: number) => {
    targetProgress = readProgress(scrollY)
    if (!raf) raf = requestAnimationFrame(apply)
  }

  const onLenisScroll = (state: { scroll: number; progress?: number }) => {
    if (typeof state.progress === 'number' && Number.isFinite(state.progress)) {
      targetProgress = clamp01(state.progress)
      if (!raf) raf = requestAnimationFrame(apply)
      return
    }
    schedule(state.scroll)
  }

  const onWindowScroll = () => {
    // When Lenis drives scroll, prefer Lenis getters; window is backup for lite mode.
    if (lenis) {
      schedule()
      return
    }
    schedule()
  }

  const onMeta = () => schedule()
  const onVis = () => {
    if (!document.hidden) schedule()
  }

  video.addEventListener('loadedmetadata', onMeta)
  video.addEventListener('loadeddata', onMeta)
  video.addEventListener('canplay', onMeta)
  document.addEventListener('visibilitychange', onVis)

  if (lenis) {
    lenis.on('scroll', onLenisScroll)
  } else {
    window.addEventListener('scroll', onWindowScroll, { passive: true })
  }

  // Initial frame (live getters — not a frozen mount-time scroll number)
  schedule()

  return () => {
    destroyed = true
    if (raf) cancelAnimationFrame(raf)
    video.removeEventListener('loadedmetadata', onMeta)
    video.removeEventListener('loadeddata', onMeta)
    video.removeEventListener('canplay', onMeta)
    document.removeEventListener('visibilitychange', onVis)
    if (lenis) {
      lenis.off('scroll', onLenisScroll)
    } else {
      window.removeEventListener('scroll', onWindowScroll)
    }
  }
}
