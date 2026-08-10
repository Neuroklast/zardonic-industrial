'use client'

import { useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { useLocale } from '@/contexts/LocaleContext'
import { resolveSectionHeading } from '@/lib/section-display'
import {
  loadLogoImageForCanvas,
  processLogoToWhiteSilhouette,
} from '@/lib/partner-logo-white'
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

    const run = async () => {
      setFailed(false)
      setProcessedSrc(null)
      try {
        const img = await loadLogoImageForCanvas(src)
        if (cancelled) return

        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height
        if (!w || !h) throw new Error('empty logo')

        // Cap huge assets so getImageData stays cheap
        const maxDim = 512
        const scale = Math.min(1, maxDim / Math.max(w, h))
        const cw = Math.max(1, Math.round(w * scale))
        const ch = Math.max(1, Math.round(h * scale))

        const canvas = document.createElement('canvas')
        canvas.width = cw
        canvas.height = ch
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) throw new Error('no canvas')

        ctx.clearRect(0, 0, cw, ch)
        ctx.drawImage(img, 0, 0, cw, ch)
        const raw = ctx.getImageData(0, 0, cw, ch)
        const processed = processLogoToWhiteSilhouette(raw)
        const out = ctx.createImageData(processed.width, processed.height)
        out.data.set(processed.data)
        ctx.putImageData(out, 0, 0)

        const dataUrl = canvas.toDataURL('image/png')
        if (!cancelled) setProcessedSrc(dataUrl)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [src])

  if (failed) {
    // Last-resort: native img, NO invert filter (invert on white-bg PNGs = solid white box).
    // Show original at reduced opacity so layout still works.
    return (
      <m.img
        src={src}
        alt={name}
        className="partner-logo-white h-12 w-auto max-w-[8.5rem] object-contain opacity-80 md:h-16 md:max-w-[10rem]"
        style={{ opacity: brightness, filter: 'none', background: 'transparent' }}
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
        className="partner-logo-white inline-block h-12 w-28 animate-pulse rounded-sm bg-muted/30 md:h-16 md:w-32"
        aria-label={name}
        role="img"
      />
    )
  }

  return (
    <m.img
      src={processedSrc}
      alt={name}
      className="partner-logo-white h-12 w-auto max-w-[8.5rem] object-contain md:h-16 md:max-w-[10rem]"
      style={{ opacity: brightness, background: 'transparent', filter: 'none' }}
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
        className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground"
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
    logoBrightness !== undefined ? Math.min(Math.max(logoBrightness, 0.25), 1) : 0.92

  if (useWhite) {
    return <PartnerLogoWhite src={item.logoUrl} name={item.name} brightness={brightness} />
  }

  return (
    <m.img
      src={item.logoUrl}
      alt={item.name}
      className="chromatic-hover h-12 w-auto max-w-[8.5rem] object-contain transition-opacity hover:opacity-100 md:h-16 md:max-w-[10rem]"
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
          const wrapperClassName = 'flex min-h-28 items-center justify-center bg-transparent p-3'

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
  const { t } = useLocale()
  const title = resolveSectionHeading(heading, 'credits', t)
  const hasAny = credits.length > 0 || endorsements.length > 0 || partners.length > 0

  return (
    <SectionWrapper id="credits" data-theme-color="foreground card border">
      <SectionHeading sectionId="credits" dataText={title}>
        {title}
      </SectionHeading>
      <SectionIntro sectionId="credits">{intro}</SectionIntro>

      {hasAny ? (
        <div className="space-y-12">
          <LogoGrid items={credits} heading={t('credits.groupCredits').toUpperCase()} logoBrightness={logoBrightness} />
          <LogoGrid items={endorsements} heading={t('credits.groupEndorsements').toUpperCase()} logoBrightness={logoBrightness} />
          <LogoGrid items={partners} heading={t('credits.groupPartners').toUpperCase()} logoBrightness={logoBrightness} />
        </div>
      ) : (
        <SectionEmpty label={t('credits.empty')} />
      )}
    </SectionWrapper>
  )
}
