'use client'

import { useEffect, useRef, useState } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { useLenisContext } from '@/contexts/LenisContext'

import { DEFAULT_HERO_LOGO_URL } from '@/lib/hero-defaults'

const HERO_CTA_CLASS =
  'cyber-border relative inline-flex min-h-[44px] cursor-pointer items-center justify-center border-border bg-card/60 px-6 py-3 text-sm uppercase tracking-[0.3em] text-foreground backdrop-blur-sm transition-colors hover:bg-card/80'

/** ~ total sequence length; HUD unmounts after this so nothing can re-layer. */
const HERO_BOOT_MS = 1100

/** Fraction of the stage that must be visible before the wordmark boot starts. */
const HERO_BOOT_VISIBLE_RATIO = 0.2

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
   * Starts when the hero stage is in view — not a page-level loader.
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
  const prefersReducedMotion = useReducedMotion()
  const { scrollTo } = useLenisContext()
  const stageRef = useRef<HTMLDivElement>(null)

  /**
   * Boot is client + visibility-gated (idle → play → done).
   * - idle: hold logo invisible until the stage is on-screen (no flash, no early play off-screen)
   * - play: one-shot CSS entrance after first paint
   * - done: static wordmark
   * Not a page loader — only the hero wordmark.
   * Skip path is derived (no sync setState in effect) for disabled / reduced-motion.
   */
  const skipBoot = !bootSequenceEnabled || Boolean(prefersReducedMotion)
  const [visibilityBoot, setVisibilityBoot] = useState<'idle' | 'play' | 'done'>('idle')
  const bootPhase: 'idle' | 'play' | 'done' = skipBoot ? 'done' : visibilityBoot

  useEffect(() => {
    if (skipBoot) return

    const stage = stageRef.current
    if (!stage) return

    let cancelled = false
    let endTimer = 0
    let raf1 = 0
    let raf2 = 0
    let started = false

    const startBoot = () => {
      if (cancelled || started) return
      started = true
      // Double rAF: wait for first paint so the animation class attaches once, cleanly.
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (cancelled) return
          setVisibilityBoot('play')
          endTimer = window.setTimeout(() => {
            if (!cancelled) setVisibilityBoot('done')
          }, HERO_BOOT_MS)
        })
      })
    }

    // Start only when the hero stage is actually visible (homepage: fires immediately).
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= HERO_BOOT_VISIBLE_RATIO) {
            startBoot()
            observer.disconnect()
            break
          }
        }
      },
      { root: null, rootMargin: '0px', threshold: [0, HERO_BOOT_VISIBLE_RATIO, 0.5, 1] },
    )
    observer.observe(stage)

    return () => {
      cancelled = true
      observer.disconnect()
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      window.clearTimeout(endTimer)
    }
  }, [skipBoot])

  const playing = bootPhase === 'play'
  /** Hide logo until client boot starts — prevents full logo flash then re-reveal (= “twice”). */
  const pendingBoot = bootPhase === 'idle' && !skipBoot
  /** Prefer admin size; default large enough for impact, not capped at 16rem. */
  const logoMax = logoMaxHeight || 'clamp(8rem, 28vw, 22rem)'
  // Content waits for boot only while it is actually playing (not idle flash).
  const contentDelay = playing ? 0.95 : pendingBoot ? 0.2 : 0

  const sectionStyle: React.CSSProperties = {
    zIndex: 'var(--z-content)',
    minHeight: minHeight || undefined,
    paddingTop: paddingTop || undefined,
  }

  const bgStyle: React.CSSProperties = {
    backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
    filter: imageBlur ? `blur(${imageBlur}px)` : undefined,
  }

  /**
   * Sizing is driven by a full-width box of height = admin size (--hero-logo-max).
   * max-height alone does not upscale small uploads; the box + object-fit does.
   * Wide wordmarks grow until they hit the content column (px-card margins).
   */
  const stageStyle: React.CSSProperties = {
    ['--hero-logo-max' as string]: logoMax,
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
        className="relative mx-auto w-full px-card text-center"
        style={{ zIndex: 'var(--z-content)' }}
      >
        {/*
          Wordmark stage: full content width (px-card margins only).
          Sizing box height = admin size → wide logos scale toward full column width.
          Boot HUD is absolute under the box (no layout shift / logo jump).
        */}
        <div
          ref={stageRef}
          className={[
            'hero-logo-stage relative mx-auto mb-6 w-full max-w-full',
            playing ? 'hero-logo-stage--booting' : '',
            bootPhase === 'done' ? 'hero-logo-stage--done' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={stageStyle}
        >
          <div
            className={[
              'hero-logo-glitch',
              pendingBoot ? 'hero-logo-boot--pending' : '',
              playing ? 'hero-logo-boot' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {playing ? <span className="hero-logo-boot__scan" aria-hidden /> : null}
            <img
              src={logoImageUrl}
              alt={headline}
              data-draft-target="hero-logo"
              className="hover-chromatic-image brightness-110"
              fetchPriority="high"
              decoding="async"
              // Full-res src; CSS box scales for display (retina when source ≥ display×dpr)
            />
          </div>

          {playing ? (
            <div className="hero-boot-hud" aria-hidden="true">
              <div className="hero-boot-hud__row">
                <span className="hero-boot-hud__label">SYS // WORDMARK</span>
                <span className="hero-boot-hud__pct">
                  <span className="hero-boot-hud__pct-fill" />
                </span>
              </div>
              <div className="hero-boot-hud__bar">
                <span className="hero-boot-hud__bar-fill" />
              </div>
              <div className="hero-boot-hud__code">
                <span className="hero-boot-hud__line hero-boot-hud__line--1">&gt; decode · rgba</span>
                <span className="hero-boot-hud__line hero-boot-hud__line--2">&gt; lock // ok</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-6xl">
        {tagline ? (
          <m.p
            initial={prefersReducedMotion || !bootSequenceEnabled ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: prefersReducedMotion || !bootSequenceEnabled ? 0 : contentDelay,
              duration: prefersReducedMotion || !bootSequenceEnabled ? 0 : 0.35,
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
          initial={prefersReducedMotion || !bootSequenceEnabled ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: prefersReducedMotion || !bootSequenceEnabled ? 0 : contentDelay + 0.12,
            duration: prefersReducedMotion || !bootSequenceEnabled ? 0 : 0.35,
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
      </div>
    </section>
  )
}
