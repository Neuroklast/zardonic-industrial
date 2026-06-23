'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'

interface BackgroundStackProps {
  imageUrl?: string
  videoUrl?: string
  backgroundType?: 'matrix' | 'circuit' | 'minimal'
  imageOpacity?: number
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

  // High performance tuning while keeping the beloved current look
  // We reduce only modestly so the rich effects (matrix rain, circuit) still feel like before
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
  backgroundType = 'matrix',
  imageOpacity = 0.55, // tuned for Digicide album art visibility while keeping rich effects on top
}: BackgroundStackProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let frameId: number | null = null
    let lastScrollY = 0
    let scrollTimeout: number | null = null
    const THROTTLE_MS = 180 // high performance: strongly relaxed to minimize conflict with Lenis and main thread (cinematic scroll video is kept but deprioritized for smoothness)

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
        // Only set if significantly different to reduce paint cost
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

    // High perf: throttle + auto-pause sync when scrolling stops
    scheduleSync()
    let lastCall = 0
    const throttledScroll = () => {
      const now = Date.now()
      if (now - lastCall > THROTTLE_MS) {
        lastCall = now
        scheduleSync()
      }

      // Pause the expensive sync after user stops scrolling
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

    // Pause when tab hidden for perf
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
  }, [videoUrl])

  return (
    <>
      {imageUrl ? (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 'var(--z-bg-image)', opacity: imageOpacity }}>
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

      {videoUrl ? (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 'var(--z-bg-animated)' }}>
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="auto"
            poster={imageUrl}
            aria-hidden="true"
          >
            <source src={videoUrl} />
          </video>
        </div>
      ) : null}

      <AnimatedLayer 
        backgroundType={backgroundType} 
        hasImage={Boolean(imageUrl) || Boolean(videoUrl)} 
        // High performance: when we have a strong static album image (Digicide), run lighter animations
        perfMode={Boolean(imageUrl)}
      />
    </>
  )
}
