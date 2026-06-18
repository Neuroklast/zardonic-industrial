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
}: {
  backgroundType: 'matrix' | 'circuit' | 'minimal'
  hasImage: boolean
}) {
  if (backgroundType === 'minimal') return null

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 'var(--z-bg-animated)' }}>
      {backgroundType === 'circuit' ? (
        <CircuitBackground />
      ) : (
        <MatrixRain transparent={hasImage} />
      )}
    </div>
  )
}

export function BackgroundStack({
  imageUrl,
  videoUrl,
  backgroundType = 'matrix',
  imageOpacity = 0.6,
}: BackgroundStackProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const syncToScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollableHeight > 0
        ? Math.min(Math.max(window.scrollY / scrollableHeight, 0), 1)
        : 0
      const duration = Number.isFinite(video.duration) ? video.duration : 0

      if (duration > 0) {
        video.currentTime = progress * duration
      }
    }

    syncToScroll()
    window.addEventListener('scroll', syncToScroll, { passive: true })
    video.addEventListener('loadedmetadata', syncToScroll)

    return () => {
      window.removeEventListener('scroll', syncToScroll)
      video.removeEventListener('loadedmetadata', syncToScroll)
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

      <AnimatedLayer backgroundType={backgroundType} hasImage={Boolean(imageUrl) || Boolean(videoUrl)} />
    </>
  )
}
