'use client'

import { m, useReducedMotion } from 'framer-motion'

const LOGO_IMAGE = '/assets/images/meta_eyJzcmNCdWNrZXQiOiJiemdsZmlsZXMifQ==.webp'

interface HeroSectionProps {
  headline: string
  tagline: string
  ctaLabel: string
  ctaUrl: string
}

export function HeroSection({ headline: _headline, tagline, ctaLabel, ctaUrl }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden scanline-effect"
      style={{ zIndex: 'var(--z-content)' as React.CSSProperties['zIndex'] }}
    >
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
        className="relative text-center px-4"
      >
        {/* Logo with chromatic aberration glitch effect */}
        <m.div
          className="mb-10 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="relative mx-auto w-fit hero-logo-glitch hover-glitch cyber2077-scan-build">
            <img
              src={LOGO_IMAGE}
              alt="Zardonic"
              className="h-32 md:h-48 lg:h-64 w-auto object-contain brightness-110 hover-chromatic-image"
              fetchPriority="high"
            />
            <img
              src={LOGO_IMAGE}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-32 md:h-48 lg:h-64 w-auto object-contain brightness-110 hero-logo-r"
            />
            <img
              src={LOGO_IMAGE}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-32 md:h-48 lg:h-64 w-auto object-contain brightness-110 hero-logo-b"
            />
          </div>
        </m.div>

        {tagline && (
          <m.p
            className="font-mono text-sm tracking-widest text-zinc-400 uppercase mb-10 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.6, duration: prefersReducedMotion ? 0 : 0.6 }}
          >
            {tagline}
          </m.p>
        )}

        <m.div
          className="flex gap-4 justify-center flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 1.0, duration: prefersReducedMotion ? 0 : 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <a
            href={ctaUrl}
            className="font-mono text-xs tracking-widest uppercase border border-zinc-600 text-zinc-300 hover:border-white hover:text-white px-6 py-3 transition-colors hover-glitch cyber-border"
          >
            <span className="hover-chromatic">{ctaLabel}</span>
          </a>
        </m.div>
      </m.div>
    </section>
  )
}
