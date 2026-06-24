'use client'

import { useState } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { useLenisContext } from '@/contexts/LenisContext'

import { DEFAULT_HERO_LOGO_URL } from '@/lib/hero-defaults'

const LOGO_IMG_CLASS =
  'hover-chromatic-image h-32 w-auto object-contain brightness-110 md:h-48 lg:h-64'

const HERO_CTA_CLASS =
  'cyber-border hover-glitch hover-noise relative inline-flex min-h-[44px] cursor-pointer items-center justify-center border-border bg-card/60 px-6 py-3 font-mono text-sm uppercase tracking-[0.3em] text-foreground backdrop-blur-sm transition-colors hover:bg-card/80'

interface HeroSectionProps {
  headline: string
  logoImageUrl?: string
  tagline?: string
  ctaLabel?: string
  ctaUrl?: string
  backgroundImageUrl?: string
  backgroundImageOpacity?: number
  minHeight?: string
  imageBlur?: number
  paddingTop?: string
  showTourDatesCta?: boolean
}



export function HeroSection({
  headline,
  logoImageUrl = DEFAULT_HERO_LOGO_URL,
  tagline,
  ctaLabel,
  ctaUrl,
  backgroundImageUrl,
  backgroundImageOpacity = 0.35,
  minHeight,
  imageBlur,
  paddingTop,
  showTourDatesCta = true,
}: HeroSectionProps) {
  const [contentLoaded] = useState(true)
  const prefersReducedMotion = useReducedMotion()
  const { scrollTo } = useLenisContext()

  const sectionStyle: React.CSSProperties = {
    zIndex: 'var(--z-content)',
    minHeight: minHeight || undefined,
    paddingTop: paddingTop || undefined,
  }

  const bgStyle: React.CSSProperties = {
    backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
    filter: imageBlur ? `blur(${imageBlur}px)` : undefined,
  }

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20 scanline-effect"
      style={sectionStyle}
      data-theme-color="foreground primary"
    >
      {backgroundImageUrl && (
        <m.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          data-draft-target="hero-bg-image"
          style={{
            ...bgStyle,
            opacity: backgroundImageOpacity,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: backgroundImageOpacity }}
          transition={{ duration: prefersReducedMotion ? 0 : 1.2, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}

      <div className="absolute inset-0 noise-effect pointer-events-none" aria-hidden="true" />

      <m.div
        initial={{ opacity: 0 }}
        animate={contentLoaded ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
        className="relative mx-auto w-full max-w-6xl px-card text-center"
        style={{ zIndex: 'var(--z-content)' }}
      >
        <m.div
          className="relative mb-6"
          initial={{ opacity: 1 }}
          animate={contentLoaded ? { opacity: 1 } : { opacity: 0 }}
        >
          <div className="hero-logo-glitch hover-glitch cyber2077-scan-build relative mx-auto w-fit">
            <img
              src={logoImageUrl}
              alt={headline}
              data-draft-target="hero-logo"
              className={LOGO_IMG_CLASS}
              fetchPriority="high"
            />
            <img
              src={logoImageUrl}
              alt=""
              aria-hidden="true"
              data-draft-target="hero-logo"
              className={`hero-logo-r absolute inset-0 ${LOGO_IMG_CLASS}`}
            />
            <img
              src={logoImageUrl}
              alt=""
              aria-hidden="true"
              data-draft-target="hero-logo"
              className={`hero-logo-b absolute inset-0 ${LOGO_IMG_CLASS}`}
            />
          </div>
        </m.div>

        {tagline ? (
          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={contentLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{
              delay: prefersReducedMotion ? 0 : 0.3,
              duration: prefersReducedMotion ? 0 : 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="mx-auto max-w-2xl font-mono text-sm uppercase tracking-[0.3em] text-muted-foreground md:text-base"
            data-draft-target="hero-tagline"
          >
            {tagline}
          </m.p>
        ) : null}

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={contentLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{
            delay: prefersReducedMotion ? 0 : 0.6,
            duration: prefersReducedMotion ? 0 : 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="relative mt-12 flex flex-wrap justify-center gap-4"
          style={{ zIndex: 'var(--z-local-top)' }}
        >
          <a
            href={ctaUrl || '#releases'}
            data-draft-target="hero-cta-link"
            onClick={(event) => {
              event.preventDefault()
              const id = (ctaUrl || '#releases').replace('#', '')
              scrollTo(id, { offset: -60 })
            }}
            className={HERO_CTA_CLASS}
          >
            <span className="hover-chromatic" data-draft-target="hero-cta">{ctaLabel || 'LISTEN NOW'}</span>
          </a>
          {showTourDatesCta ? (
            <a
              href="#gigs"
              onClick={(event) => {
                event.preventDefault()
                scrollTo('gigs', { offset: -60 })
              }}
              className={HERO_CTA_CLASS}
            >
              <span className="hover-chromatic">TOUR DATES</span>
            </a>
          ) : null}
        </m.div>
      </m.div>
    </section>
  )
}
