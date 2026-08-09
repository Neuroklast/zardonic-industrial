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
  /**
   * Short filmic terminal boot for the wordmark (scan, mini bar, micro code).
   * Default true. When false, logo shows immediately with no entrance gimmicks.
   */
  bootSequenceEnabled?: boolean
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
  bootSequenceEnabled = true,
}: HeroSectionProps) {
  const [contentLoaded] = useState(true)
  const prefersReducedMotion = useReducedMotion()
  const { scrollTo } = useLenisContext()

  const runBoot = Boolean(bootSequenceEnabled) && !prefersReducedMotion
  const logoMax = logoMaxHeight || 'clamp(6rem, 22vw, 16rem)'

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
          Wordmark stage: optional short boot (~1.2s) — scan + RGB + mini HUD.
          No layout shift / no position jitter. hero-logo-glitch = test alias.
        */}
        <div
          className={`hero-logo-stage relative mx-auto mb-6 w-fit max-w-full ${runBoot ? 'hero-logo-stage--boot' : ''}`}
          style={{ maxHeight: logoMax }}
        >
          {runBoot ? (
            <>
              <span className="hero-boot-frame hero-boot-frame--tl" aria-hidden />
              <span className="hero-boot-frame hero-boot-frame--tr" aria-hidden />
              <span className="hero-boot-frame hero-boot-frame--bl" aria-hidden />
              <span className="hero-boot-frame hero-boot-frame--br" aria-hidden />
            </>
          ) : null}

          <div
            className={`hero-logo-glitch relative ${runBoot ? 'hero-logo-boot' : ''}`}
            style={{ maxHeight: logoMax }}
          >
            {runBoot ? (
              <>
                <span className="hero-logo-boot__scan" aria-hidden />
                <span className="hero-logo-boot__scan hero-logo-boot__scan--soft" aria-hidden />
                <span className="hero-logo-boot__rgb hero-logo-boot__rgb--r" aria-hidden>
                  <img
                    src={logoImageUrl}
                    alt=""
                    className="mx-auto h-auto w-auto max-w-full object-contain"
                    style={{ maxHeight: logoMax }}
                    decoding="async"
                  />
                </span>
                <span className="hero-logo-boot__rgb hero-logo-boot__rgb--b" aria-hidden>
                  <img
                    src={logoImageUrl}
                    alt=""
                    className="mx-auto h-auto w-auto max-w-full object-contain"
                    style={{ maxHeight: logoMax }}
                    decoding="async"
                  />
                </span>
              </>
            ) : null}
            <img
              src={logoImageUrl}
              alt={headline}
              data-draft-target="hero-logo"
              className="hover-chromatic-image mx-auto h-auto w-auto max-w-full object-contain brightness-110"
              style={{
                maxHeight: logoMax,
                width: 'auto',
              }}
              fetchPriority="high"
              decoding="async"
            />
          </div>

          {runBoot ? (
            <div className="hero-boot-hud" aria-hidden="true">
              <div className="hero-boot-hud__row">
                <span className="hero-boot-hud__label">SYS // WORDMARK</span>
                <span className="hero-boot-hud__pct">
                  <span className="hero-boot-hud__pct-fill" />
                </span>
              </div>
              <div className="hero-boot-hud__bar">
                <span className="hero-boot-hud__bar-fill" />
                <span className="hero-boot-hud__bar-glitch" />
              </div>
              <div className="hero-boot-hud__code">
                <span className="hero-boot-hud__line hero-boot-hud__line--1">
                  &gt; decode · rgba_lock
                </span>
                <span className="hero-boot-hud__line hero-boot-hud__line--2">
                  &gt; chroma // 0xA7F2
                </span>
                <span className="hero-boot-hud__line hero-boot-hud__line--3">
                  &gt; sync_ok · ready
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {tagline ? (
          <m.p
            initial={prefersReducedMotion || !runBoot ? false : { opacity: 0 }}
            animate={contentLoaded ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              delay: prefersReducedMotion || !runBoot ? 0 : 1.05,
              duration: prefersReducedMotion || !runBoot ? 0 : 0.4,
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
          initial={prefersReducedMotion || !runBoot ? false : { opacity: 0 }}
          animate={contentLoaded ? { opacity: 1 } : { opacity: 0 }}
          transition={{
            delay: prefersReducedMotion || !runBoot ? 0 : 1.15,
            duration: prefersReducedMotion || !runBoot ? 0 : 0.35,
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
