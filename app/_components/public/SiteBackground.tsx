/**
 * SiteBackground
 * Full-screen background supporting either a video or an image.
 * - If `videoUrl` is provided the video loops silently as the background;
 *   the static image is kept as a poster / fallback.
 * - A dark vignette and a CSS-only CRT/scanline overlay are always applied.
 * - The circuit board animated overlay renders on top (--z-bg-animated).
 * - Fixed positioning keeps the background behind all foreground content
 *   while the page scrolls normally on top of it (parallax-style).
 */
'use client'

import Image from 'next/image'
import { Suspense, lazy } from 'react'

const CircuitBackground = lazy(() =>
  import('./CircuitBackground').then(m => ({ default: m.CircuitBackground }))
)

interface SiteBackgroundProps {
  imageUrl: string
  videoUrl?: string | null
  alt?: string
}

export function SiteBackground({ imageUrl, videoUrl, alt = 'Background' }: SiteBackgroundProps) {
  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 'var(--z-bg-image)' as React.CSSProperties['zIndex'] }}
        aria-hidden="true"
      >
        {/* Static image – always rendered as poster / fallback */}
        <Image
          src={imageUrl}
          alt={alt}
          fill
          priority
          quality={80}
          className="object-cover object-center"
          sizes="100vw"
        />

        {/* Video background (looping, muted, no controls) */}
        {videoUrl && (
          <video
            key={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover object-center"
            poster={imageUrl}
          >
            <source src={videoUrl} />
          </video>
        )}

        {/* Dark vignette to keep text readable */}
        <div className="absolute inset-0 bg-black/70" />

        {/* CRT scanline overlay – CSS-only, no JS */}
        <div
          className="absolute inset-0 scanline-layer"
          style={{ zIndex: 'var(--z-bg-scanline)' as React.CSSProperties['zIndex'] }}
        />
      </div>

      {/* Circuit board animated overlay */}
      <Suspense fallback={null}>
        <CircuitBackground />
      </Suspense>
    </>
  )
}
