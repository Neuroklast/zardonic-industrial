/**
 * SiteBackground
 * Full-screen background with the album cover image and a CSS-only CRT / scanline overlay.
 * The overlay sits BELOW all foreground content (z-index: var(--z-bg-scanline)).
 * Rendered as a client component so the image src can be passed from the server.
 */
'use client'

import Image from 'next/image'

interface SiteBackgroundProps {
  imageUrl: string
  alt?: string
}

export function SiteBackground({ imageUrl, alt = 'Background' }: SiteBackgroundProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 'var(--z-bg-image)' as React.CSSProperties['zIndex'] }}
      aria-hidden="true"
    >
      {/* Album cover */}
      <Image
        src={imageUrl}
        alt={alt}
        fill
        priority
        quality={80}
        className="object-cover object-center"
        sizes="100vw"
      />
      {/* Dark vignette to keep text readable */}
      <div className="absolute inset-0 bg-black/70" />
      {/* CRT scanline overlay – CSS-only, no JS */}
      <div
        className="absolute inset-0 scanline-layer"
        style={{ zIndex: 'var(--z-bg-scanline)' as React.CSSProperties['zIndex'] }}
      />
    </div>
  )
}
