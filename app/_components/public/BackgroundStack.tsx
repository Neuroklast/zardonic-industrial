'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  DEFAULT_BACKGROUND_VIDEO_OPACITY,
  parseMobileVideoMode,
  resolveActiveBackgroundVideoUrl,
  type MobileVideoMode,
} from '@/lib/background-config'

interface BackgroundStackProps {
  imageUrl?: string
  videoUrl?: string
  mobileVideoUrl?: string
  mobileVideoMode?: MobileVideoMode
  backgroundType?: 'matrix' | 'circuit' | 'minimal'
  imageOpacity?: number
  videoOpacity?: number
}

const MatrixRain = dynamic(() => import('@/components/MatrixRain'), { ssr: false })
const CircuitBackground = dynamic(
  () => import('@/components/CircuitBackground').then((module) => ({ default: module.CircuitBackground })),
  { ssr: false },
)

function AnimatedLayer({
  backgroundType,
  hasImage,
  perfMode = false,
}: {
  backgroundType: 'matrix' | 'circuit' | 'minimal'
  hasImage: boolean
  perfMode?: boolean
}) {
  if (backgroundType === 'minimal') return null

  const matrixDensity = perfMode ? 0.55 : 0.7
  const matrixSpeed = perfMode ? 0.85 : 1.0
  const circuitSpeed = perfMode ? 0.8 : 1.0
  const circuitGlow = perfMode ? 0.75 : 0.8

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 'var(--z-bg-animated)' }}>
      {backgroundType === 'circuit' ? (
        <CircuitBackground speed={circuitSpeed} glow={circuitGlow} />
      ) : (
        <MatrixRain transparent={hasImage} density={matrixDensity} speed={matrixSpeed} />
      )}
    </div>
  )
}

export function BackgroundStack({
  imageUrl,
  videoUrl,
  mobileVideoUrl,
  mobileVideoMode = 'same',
  backgroundType = 'matrix',
  imageOpacity = 0.55,
  videoOpacity = DEFAULT_BACKGROUND_VIDEO_OPACITY,
}: BackgroundStackProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isMobile = useIsMobile()
  const mode = parseMobileVideoMode(mobileVideoMode)

  const activeVideoUrl = useMemo(
    () => resolveActiveBackgroundVideoUrl(videoUrl, mobileVideoUrl, mode, isMobile),
    [videoUrl, mobileVideoUrl, mode, isMobile],
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let frameId: number | null = null
    let lastScrollY = 0
    let scrollTimeout: number | null = null
    const THROTTLE_MS = 180

    const syncToScroll = () => {
      frameId = null
      const scrollY = window.scrollY
      if (Math.abs(scrollY - lastScrollY) < 12) return
      lastScrollY = scrollY

      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollableHeight > 0
        ? Math.min(Math.max(scrollY / scrollableHeight, 0), 1)
        : 0
      const duration = Number.isFinite(video.duration) ? video.duration : 0

      if (duration > 0) {
        const targetTime = progress * duration
        if (Math.abs(video.currentTime - targetTime) > 0.1) {
          video.currentTime = targetTime
        }
      }
    }

    const scheduleSync = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(syncToScroll)
    }

    scheduleSync()
    let lastCall = 0
    const throttledScroll = () => {
      const now = Date.now()
      if (now - lastCall > THROTTLE_MS) {
        lastCall = now
        scheduleSync()
      }

      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollTimeout = window.setTimeout(() => {
        if (frameId) {
          cancelAnimationFrame(frameId)
          frameId = null
        }
      }, 800)
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    video.addEventListener('loadedmetadata', scheduleSync)

    const onVisibility = () => {
      if (document.hidden && frameId) {
        cancelAnimationFrame(frameId)
        frameId = null
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      if (scrollTimeout) clearTimeout(scrollTimeout)
      window.removeEventListener('scroll', throttledScroll)
      video.removeEventListener('loadedmetadata', scheduleSync)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [activeVideoUrl])

  return (
    <>
      {imageUrl ? (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 'var(--z-bg-image)', opacity: imageOpacity }}
          data-draft-target="bg-image"
        >
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      ) : null}

      {activeVideoUrl ? (
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden bg-black"
          style={{ zIndex: 'var(--z-bg-video)', opacity: videoOpacity }}
          data-draft-target="bg-video-wrap"
        >
          <video
            key={activeVideoUrl}
            ref={videoRef}
            className="h-full w-full object-cover"
            data-draft-target="bg-video"
            muted
            playsInline
            preload="auto"
            poster={imageUrl}
            aria-hidden="true"
          >
            <source src={activeVideoUrl} />
          </video>
          <div className="absolute inset-0 bg-black/45 pointer-events-none" aria-hidden="true" />
        </div>
      ) : null}

      <AnimatedLayer
        backgroundType={backgroundType}
        hasImage={Boolean(imageUrl) || Boolean(activeVideoUrl)}
        perfMode={Boolean(imageUrl)}
      />
    </>
  )
}