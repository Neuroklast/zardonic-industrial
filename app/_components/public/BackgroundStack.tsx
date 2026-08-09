'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useLenisContext } from '@/contexts/LenisContext'
import { useAdminDraftListener } from '@/hooks/use-admin-draft'
import type { AdminDraftKey } from '@/lib/admin-draft-channel'
import { toDirectImageUrl } from '@/lib/image-cache'
import {
  DEFAULT_BACKGROUND_VIDEO_OPACITY,
  parseMobileVideoMode,
  resolveActiveBackgroundVideoUrl,
  type MobileVideoMode,
} from '@/lib/background-config'
import {
  isPublicBackgroundType,
  parsePublicBackgroundType,
  type PublicBackgroundType,
} from '@/lib/public-background-types'
import { attachScrollVideoSync } from '@/lib/scroll-video-sync'

interface BackgroundStackProps {
  imageUrl?: string
  videoUrl?: string
  mobileVideoUrl?: string
  mobileVideoMode?: MobileVideoMode
  /** Master switch — when false, video layer is not rendered even if URLs exist. */
  videoEnabled?: boolean
  backgroundType?: PublicBackgroundType
  imageOpacity?: number
  videoOpacity?: number
}

const MatrixRain = dynamic(() => import('@/components/MatrixRain'), { ssr: false })
const CircuitBackground = dynamic(
  () => import('@/components/CircuitBackground').then((module) => ({ default: module.CircuitBackground })),
  { ssr: false },
)
const TerminalBackground = dynamic(() => import('@/components/TerminalBackground'), { ssr: false })
const DataStreamBackground = dynamic(() => import('@/components/DataStreamBackground'), { ssr: false })
const StarField = dynamic(() => import('@/components/StarField'), { ssr: false })
const GlitchGridBackground = dynamic(() => import('@/components/GlitchGridBackground'), { ssr: false })

function AnimatedLayer({
  backgroundType,
  hasImage,
  perfMode = false,
}: {
  backgroundType: PublicBackgroundType
  hasImage: boolean
  perfMode?: boolean
}) {
  if (backgroundType === 'minimal') return null

  const matrixDensity = perfMode ? 0.5 : 0.7
  const matrixSpeed = perfMode ? 0.85 : 1.0
  const circuitSpeed = perfMode ? 0.8 : 1.0
  const circuitGlow = perfMode ? 0.75 : 0.8

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 'var(--z-bg-animated)' }}
      data-draft-target="bg-animation"
      data-draft-bg-type={backgroundType}
    >
      {backgroundType === 'circuit' ? (
        <CircuitBackground speed={circuitSpeed} glow={circuitGlow} />
      ) : backgroundType === 'terminal' ? (
        <TerminalBackground opacity={hasImage ? 0.45 : 0.6} perfMode={perfMode} />
      ) : backgroundType === 'data-stream' ? (
        <DataStreamBackground opacity={hasImage ? 0.4 : 0.55} perfMode={perfMode} />
      ) : backgroundType === 'stars' ? (
        <StarField transparent={hasImage} starCount={perfMode ? 80 : 140} starSpeed={perfMode ? 0.6 : 1} />
      ) : backgroundType === 'glitch-grid' ? (
        <GlitchGridBackground transparent={hasImage} />
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
  videoEnabled = true,
  backgroundType = 'matrix',
  imageOpacity = 0.55,
  videoOpacity = DEFAULT_BACKGROUND_VIDEO_OPACITY,
}: BackgroundStackProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isMobile = useIsMobile()
  const { lenis } = useLenisContext()
  const [draftBackgroundType, setDraftBackgroundType] = useState<PublicBackgroundType | null>(null)
  const [draftVideoEnabled, setDraftVideoEnabled] = useState<boolean | null>(null)

  const onDraft = useCallback((key: AdminDraftKey, value: Record<string, unknown>) => {
    if (key !== 'background') return
    if (isPublicBackgroundType(value.backgroundType)) {
      setDraftBackgroundType(value.backgroundType)
    }
    if (typeof value.backgroundVideoEnabled === 'boolean') {
      setDraftVideoEnabled(value.backgroundVideoEnabled)
    }
  }, [])

  useAdminDraftListener(onDraft)

  const effectiveBackgroundType = draftBackgroundType ?? parsePublicBackgroundType(backgroundType)
  const effectiveVideoEnabled = draftVideoEnabled ?? videoEnabled
  const mode = parseMobileVideoMode(mobileVideoMode)

  const activeVideoUrl = useMemo(
    () =>
      resolveActiveBackgroundVideoUrl(
        videoUrl,
        mobileVideoUrl,
        mode,
        isMobile,
        effectiveVideoEnabled,
      ),
    [videoUrl, mobileVideoUrl, mode, isMobile, effectiveVideoEnabled],
  )

  // Smooth scroll-scrub: Lenis progress + rAF + seek coalescing
  useEffect(() => {
    const video = videoRef.current
    if (!video || !activeVideoUrl) return

    return attachScrollVideoSync({
      video,
      lenis: lenis
        ? {
            on: (e, cb) => {
              lenis.on(e, cb as (s: { scroll: number }) => void)
            },
            off: (e, cb) => {
              lenis.off(e, cb as (s: { scroll: number }) => void)
            },
            scroll: typeof lenis.scroll === 'number' ? lenis.scroll : undefined,
          }
        : null,
      minDeltaSec: 1 / 48,
    })
  }, [activeVideoUrl, lenis])

  return (
    <>
      {imageUrl ? (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 'var(--z-bg-image)', opacity: imageOpacity }}
          data-draft-target="bg-image"
        >
          <img
            src={toDirectImageUrl(imageUrl, { w: 1920, q: 80 }) || imageUrl}
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
        backgroundType={effectiveBackgroundType}
        hasImage={Boolean(imageUrl) || Boolean(activeVideoUrl)}
        perfMode={Boolean(imageUrl) || Boolean(activeVideoUrl) || isMobile}
      />
    </>
  )
}
