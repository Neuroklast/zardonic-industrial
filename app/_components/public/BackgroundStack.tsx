'use client'

import dynamic from 'next/dynamic'

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
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
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
