'use client'

import { useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { formatSectionHeading } from '@/lib/section-display'
import { partnerLogoCanvasSrc, processLogoToWhiteSilhouette } from '@/lib/partner-logo-white'
import { SectionWrapper, SectionEmpty, SectionHeading, SectionIntro } from './SectionWrapper'

interface PartnerItem {
  id: string
  name: string
  url: string | null
  logoUrl: string | null
  category: string
  logoWhite?: boolean
}

/**
 * Partner / credit logo in white mode.
 * Canvas-processes the PNG so alpha is real (transparent stays transparent)
 * and baked white backgrounds are stripped — CSS mask-image + CORS was
 * painting solid white rectangles on R2 URLs.
 */
function PartnerLogoWhite({
  src,
  name,
  brightness,
}: {
  src: string
  name: string
  brightness: number
}) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    const run = async () => {
      setFailed(false)
      setProcessedSrc(null)
      try {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.decoding = 'async'
        const loadSrc = partnerLogoCanvasSrc(src)

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('logo load failed'))
          img.src = loadSrc
        })

        if (cancelled) return

        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height
        if (!w || !h) throw new Error('empty logo')

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) throw new Error('no canvas')

        ctx.drawImage(img, 0, 0)
        const raw = ctx.getImageData(0, 0, w, h)
        const processed = processLogoToWhiteSilhouette(raw)
        const out = ctx.createImageData(processed.width, processed.height)
        out.data.set(processed.data)
        ctx.putImageData(out, 0, 0)

        objectUrl = canvas.toDataURL('image/png')
        if (!cancelled) setProcessedSrc(objectUrl)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    void run()

    return () => {
      cancelled = true
      // data URLs do not need revoke; keep hook for future blob URLs
      void objectUrl
    }
  }, [src])

  if (failed) {
    // Fallback: CSS filter (alpha-preserving when PNG is already transparent)
    return (
      <m.img
        src={src}
        alt={name}
        className="partner-logo-white h-10 w-auto max-w-[7.5rem] object-contain md:h-14 md:max-w-[9rem]"
        style={{ opacity: brightness }}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: brightness, y: 0 }}
        whileHover={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        loading="lazy"
        decoding="async"
      />
    )
  }

  if (!processedSrc) {
    return (
      <span
        className="partner-logo-white inline-block h-10 w-24 animate-pulse bg-muted/40 md:h-14 md:w-28"
        aria-label={name}
        role="img"
      />
    )
  }

  return (
    <m.img
      src={processedSrc}
      alt={name}
      className="partner-logo-white h-10 w-auto max-w-[7.5rem] object-contain md:h-14 md:max-w-[9rem]"
      style={{ opacity: brightness, background: 'transparent' }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: brightness, y: 0 }}
      whileHover={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      decoding="async"
    />
  )
}

function PartnerLogo({
  item,
  logoBrightness,
}: {
  item: PartnerItem
  logoBrightness?: number
}) {
  if (!item.logoUrl) {
    return (
      <m.span
        className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {item.name}
      </m.span>
    )
  }

  const useWhite = item.logoWhite !== false
  const brightness =
    logoBrightness !== undefined ? Math.min(Math.max(logoBrightness, 0.25), 1) : 0.9

  if (useWhite) {
    return <PartnerLogoWhite src={item.logoUrl} name={item.name} brightness={brightness} />
  }

  return (
    <m.img
      src={item.logoUrl}
      alt={item.name}
      className="chromatic-hover h-10 w-auto max-w-[7.5rem] object-contain transition-opacity hover:opacity-100 md:h-14 md:max-w-[9rem]"
      style={{ opacity: brightness }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: brightness, y: 0 }}
      whileHover={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      loading="lazy"
      decoding="async"
    />
  )
}

interface CreditsAndEndorsementsProps {
  credits: PartnerItem[]
  endorsements: PartnerItem[]
  partners?: PartnerItem[]
  heading?: string
  intro?: string
  logoBrightness?: number
}

function LogoGrid({
  items,
  heading,
  logoBrightness,
}: {
  items: PartnerItem[]
  heading: string
  logoBrightness?: number
}) {
  if (items.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="data-label" data-theme-color="data-label">
        // {heading}
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => {
          const content = <PartnerLogo item={item} logoBrightness={logoBrightness} />
          const wrapperClassName = 'flex min-h-24 items-center justify-center bg-transparent p-2'

          return item.url ? (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={wrapperClassName}
              aria-label={item.name}
            >
              {content}
            </a>
          ) : (
            <div key={item.id} className={wrapperClassName}>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CreditsSection({
  credits,
  endorsements,
  partners = [],
  heading,
  intro,
  logoBrightness,
}: CreditsAndEndorsementsProps) {
  const title = formatSectionHeading(heading, 'credits')
  const hasAny = credits.length > 0 || endorsements.length > 0 || partners.length > 0

  return (
    <SectionWrapper id="credits" data-theme-color="foreground card border">
      <SectionHeading sectionId="credits" dataText={title}>
        {title}
      </SectionHeading>
      <SectionIntro sectionId="credits">{intro}</SectionIntro>

      {hasAny ? (
        <div className="space-y-12">
          <LogoGrid items={credits} heading="CREDITS" logoBrightness={logoBrightness} />
          <LogoGrid items={endorsements} heading="ENDORSEMENTS" logoBrightness={logoBrightness} />
          <LogoGrid items={partners} heading="PARTNERS" logoBrightness={logoBrightness} />
        </div>
      ) : (
        <SectionEmpty label="Credits coming soon" />
      )}
    </SectionWrapper>
  )
}
