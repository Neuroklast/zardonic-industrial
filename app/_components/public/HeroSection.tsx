'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { m, useReducedMotion } from 'framer-motion'

const logoImage = '/assets/images/meta_eyJzcmNCdWNrZXQiOiJiemdsZmlsZXMifQ==.webp'

interface HeroSectionProps {
  headline: string
  tagline?: string
  ctaLabel?: string
  ctaUrl?: string
  backgroundImageUrl?: string
  backgroundImageOpacity?: number
}

function handleAnchorNavigation(event: MouseEvent<HTMLAnchorElement>, target: string) {
  if (!target.startsWith('#')) return

  const element = document.querySelector<HTMLElement>(target)
  if (!element) return

  event.preventDefault()
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function HeroSection({
  headline,
  tagline,
  ctaLabel,
  ctaUrl,
  backgroundImageUrl,
  backgroundImageOpacity = 0.35,
}: HeroSectionProps) {
  const [contentLoaded, setContentLoaded] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const timer = window.setTimeout(() => setContentLoaded(true), 0)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20 scanline-effect"
      style={{ zIndex: 'var(--z-content)' }}
      data-theme-color="foreground primary"
    >
      {backgroundImageUrl && (
        <m.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: backgroundImageOpacity }}
          transition={{ duration: prefersReducedMotion ? 0 : 1.2, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}

      <div className="absolute inset-0 noise-effect" aria-hidden="true" />

      <m.div
        initial={{ opacity: 0 }}
        animate={contentLoaded ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
        className="relative px-4 text-center"
        style={{ zIndex: 'var(--z-content)' }}
      >
        <m.div
          className="relative mb-6"
          initial={{ opacity: 1 }}
          animate={contentLoaded ? { opacity: 1 } : { opacity: 0 }}
        >
          <div className="hero-logo-glitch hover-glitch cyber2077-scan-build relative mx-auto w-fit">
            <img
              src={logoImage}
              alt={headline}
              className="hover-chromatic-image h-32 w-auto object-contain brightness-110 md:h-48 lg:h-64"
              fetchPriority="high"
            />
            <img
              src={logoImage}
              alt=""
              aria-hidden="true"
              className="hero-logo-r absolute inset-0 h-32 w-auto object-contain brightness-110 md:h-48 lg:h-64"
            />
            <img
              src={logoImage}
              alt=""
              aria-hidden="true"
              className="hero-logo-b absolute inset-0 h-32 w-auto object-contain brightness-110 md:h-48 lg:h-64"
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
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          <a
            href={ctaUrl || '#releases'}
            onClick={(event) => handleAnchorNavigation(event, ctaUrl || '#releases')}
            className="cyber-border hover-glitch hover-noise relative inline-flex items-center justify-center px-6 py-3 font-mono text-sm uppercase tracking-[0.3em]"
          >
            <span className="hover-chromatic">{ctaLabel || 'LISTEN NOW'}</span>
          </a>
          <a
            href="#gigs"
            onClick={(event) => handleAnchorNavigation(event, '#gigs')}
            className="cyber-border hover-glitch hover-noise relative inline-flex items-center justify-center px-6 py-3 font-mono text-sm uppercase tracking-[0.3em]"
          >
            <span className="hover-chromatic">TOUR DATES</span>
          </a>
        </m.div>
      </m.div>
    </section>
  )
}
