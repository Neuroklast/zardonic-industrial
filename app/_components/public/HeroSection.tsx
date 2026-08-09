'use client'

import { useState } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { useLenisContext } from '@/contexts/LenisContext'

import { DEFAULT_HERO_LOGO_URL } from '@/lib/hero-defaults'

const HERO_CTA_CLASS =
  'cyber-border relative inline-flex min-h-[44px] cursor-pointer items-center justify-center border-border bg-card/60 px-6 py-3 text-sm uppercase tracking-[0.3em] text-foreground backdrop-blur-sm transition-colors hover:bg-card/80'

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
  /** CSS length for hero wordmark max height (e.g. 12rem, 200px). */
  logoMaxHeight?: string
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
  logoMaxHeight,
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
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: backgroundImageOpacity }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        />
      )}

      <div className="absolute inset-0 noise-effect pointer-events-none" aria-hidden="true" />

      <div
        className="relative mx-auto w-full max-w-6xl px-card text-center"
        style={{ zIndex: 'var(--z-content)' }}
      >
        {/*
          Terminal boot reveal: CRT raster build + one RGB tear.
          Class hero-logo-glitch kept for regression tests; boot styles on hero-logo-boot.
        */}
        <div className="hero-logo-glitch hero-logo-boot relative mb-6">
          <span className="hero-logo-boot__scan" aria-hidden />
          <img
            src={logoImageUrl}
            alt={headline}
            data-draft-target="hero-logo"
            className="hover-chromatic-image mx-auto h-auto w-auto max-w-full object-contain brightness-110"
            style={{
              maxHeight: logoMaxHeight || 'clamp(6rem, 22vw, 16rem)',
              width: 'auto',
            }}
            fetchPriority="high"
            decoding="async"
          />
        </div>

        {tagline ? (
          <m.p
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={contentLoaded ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              delay: prefersReducedMotion ? 0 : 0.75,
              duration: prefersReducedMotion ? 0 : 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mx-auto max-w-2xl text-sm uppercase tracking-[0.3em] text-muted-foreground md:text-base"
            style={{ fontFamily: 'var(--font-mono, var(--font-body, monospace))' }}
            data-draft-target="hero-tagline"
          >
            {tagline}
          </m.p>
        ) : null}

        <m.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={contentLoaded ? { opacity: 1 } : { opacity: 0 }}
          transition={{
            delay: prefersReducedMotion ? 0 : 0.95,
            duration: prefersReducedMotion ? 0 : 0.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative mt-12 flex flex-wrap justify-center gap-4"
          style={{ zIndex: 'var(--z-local-top)', fontFamily: 'var(--font-mono, monospace)' }}
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
            <span data-draft-target="hero-cta">{ctaLabel || 'LISTEN NOW'}</span>
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
              <span>TOUR DATES</span>
            </a>
          ) : null}
        </m.div>
      </div>
    </section>
  )
}
