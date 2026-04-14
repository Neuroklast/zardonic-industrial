import { useEffect, useRef, useState, memo } from 'react'
import { shouldUseLiteMode } from '@/lib/device-capability'
import { toDirectImageUrl } from '@/lib/image-cache'

interface VideoBackgroundProps {
  /** URL of the video file (MP4/WebM). External URLs are served directly. */
  videoUrl: string
  /**
   * Fallback image URL shown when:
   *   - Device is in lite mode (reduced-motion / slow connection / low-end HW)
   *   - Video fails to load or play
   *   - While the video is buffering (poster)
   */
  fallbackImageUrl?: string
  /** Overall layer opacity (0–1). Default: 1. */
  opacity?: number
  /** CSS object-fit for the video/image. Default: 'cover'. */
  fit?: 'cover' | 'contain' | 'fill' | 'none'
}

/**
 * VideoBackground — fixed full-screen looping video at `--z-bg-animated` (z=1).
 *
 * The video plays `autoPlay muted loop playsInline` to satisfy all browser
 * autoplay policies. No user consent is required because there is no
 * third-party tracking (same as a background image).
 *
 * **Fallback chain (highest → lowest priority):**
 * 1. Lite mode detected at mount (reduced-motion / slow connection / low-end HW)
 *    → render `<img>` only, never attempt video load
 * 2. Video `onError` or `onStalled` → switch from video to `<img>`
 * 3. No fallback image provided → render nothing when video is not available
 *
 * The `poster` attribute is always set to the fallback image URL so the
 * browser renders the static image instantly while the video buffers.
 */
const VideoBackground = memo(function VideoBackground({
  videoUrl,
  fallbackImageUrl,
  opacity = 1,
  fit = 'cover',
}: VideoBackgroundProps) {
  const [useFallback, setUseFallback] = useState<boolean>(() => shouldUseLiteMode())
  const videoRef = useRef<HTMLVideoElement>(null)

  // Attempt to start playback once the element is mounted. Some browsers
  // (particularly Safari on iOS) require an explicit play() call.
  useEffect(() => {
    if (useFallback) return
    const video = videoRef.current
    if (!video) return

    const handleError = () => setUseFallback(true)
    video.addEventListener('error', handleError)

    // If the video stalls for >10s, fall back to image so the page doesn't look broken.
    let stallTimer: ReturnType<typeof setTimeout>
    const handleStall = () => {
      stallTimer = setTimeout(() => setUseFallback(true), 10_000)
    }
    const handleProgress = () => clearTimeout(stallTimer)

    video.addEventListener('stalled', handleStall)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('playing', handleProgress)

    video.play()?.catch(() => {
      // Autoplay was blocked — show fallback image
      setUseFallback(true)
    })

    return () => {
      clearTimeout(stallTimer)
      video.removeEventListener('error', handleError)
      video.removeEventListener('stalled', handleStall)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('playing', handleProgress)
    }
  }, [useFallback, videoUrl])

  const sharedStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: fit,
    objectPosition: 'center',
    pointerEvents: 'none',
    opacity,
    display: 'block',
  }

  // Lite mode or fallback: render static image only
  if (useFallback) {
    if (!fallbackImageUrl) return null
    return (
      <img
        src={toDirectImageUrl(fallbackImageUrl, { output: 'webp', q: 80 })}
        alt=""
        aria-hidden="true"
        style={sharedStyle}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    )
  }

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
      poster={
        fallbackImageUrl
          ? toDirectImageUrl(fallbackImageUrl, { output: 'webp', q: 80 })
          : undefined
      }
      style={sharedStyle}
      preload="auto"
    />
  )
})

export default VideoBackground
