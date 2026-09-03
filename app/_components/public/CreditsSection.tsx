'use client'

import { useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { useLocale } from '@/contexts/LocaleContext'
import { resolveSectionHeading } from '@/lib/section-display'
import { sanitizeExternalHref } from '@/lib/sanitize-href'
import {
  loadLogoImageForCanvas,
  logoRasterSize,
  preparePartnerLogoSrc,
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

        // Upscale tiny SVG defaults (155×18) and cap huge assets
        const { width: cw, height: ch } = logoRasterSize(w, h)

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
    // filter stays in CSS only — inline filter:none would block hover chromatic.
    return (
      <m.img
        src={src}
        alt={name}
        className="partner-logo-white h-12 w-auto min-w-[4rem] max-w-[8.5rem] object-contain opacity-80 md:h-16 md:max-w-[10rem]"
        style={{ opacity: brightness, background: 'transparent' }}
        initial={false}
        animate={{ opacity: brightness }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
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
      className="partner-logo-white h-12 w-auto min-w-[4rem] max-w-[8.5rem] object-contain md:h-16 md:max-w-[10rem]"
      style={{ opacity: brightness, background: 'transparent' }}
      initial={false}
      animate={{ opacity: brightness }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      decoding="async"
    />
  )
}

function PartnerNameFallback({ name }: { name: string }) {
  return (
    <m.span
      className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground"
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {name}
    </m.span>
  )
}

function PartnerLogoNative({
  src,
  name,
  brightness,
}: {
  src: string
  name: string
  brightness: number
}) {
  const [displaySrc, setDisplaySrc] = useState(src)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let blobUrl: string | null = null
    void preparePartnerLogoSrc(src).then((next) => {
      if (cancelled) {
        if (next.startsWith('blob:')) URL.revokeObjectURL(next)
        return
      }
      if (next && next !== src) {
        blobUrl = next
        setDisplaySrc(next)
      }
    })
    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [src])

  if (failed) return <PartnerNameFallback name={name} />

  return (
    <m.img
      src={displaySrc}
      alt={name}
      className="partner-logo-native h-12 w-auto min-w-[4rem] max-w-[8.5rem] object-contain transition-opacity hover:opacity-100 md:h-16 md:max-w-[10rem]"
      style={{ opacity: brightness, background: 'transparent' }}
      initial={false}
      animate={{ opacity: brightness }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      decoding="async"
      onError={() => {
        if (displaySrc !== src) {
          setDisplaySrc(src)
          return
        }
        setFailed(true)
      }}
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
    return <PartnerNameFallback name={item.name} />
  }

  const useWhite = item.logoWhite !== false
  const brightness =
    logoBrightness !== undefined ? Math.min(Math.max(logoBrightness, 0.25), 1) : 0.92

  if (useWhite) {
    return <PartnerLogoWhite src={item.logoUrl} name={item.name} brightness={brightness} />
  }

  // logo_white off: original colours; SVG rewritten to a large view size so it stays sharp
  return (
    <PartnerLogoNative
      key={item.logoUrl}
      src={item.logoUrl}
      name={item.name}
      brightness={brightness}
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
          // group so chromatic hover fires for the full cell hit-area, not only the img pixels
          const wrapperClassName =
            'partner-logo-cell group flex min-h-28 items-center justify-center bg-transparent p-3'

          return item.url ? (
            <a
              key={item.id}
              href={sanitizeExternalHref(item.url)}
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
  const { t, locale } = useLocale()
  const title = resolveSectionHeading(heading, 'credits', t, locale)
  const hasAny = credits.length > 0 || endorsements.length > 0 || partners.length > 0

  return (
    <SectionWrapper id="credits" data-theme-color="foreground card border">
      <SectionHeading sectionId="credits" dataText={title}>
        {title}
      </SectionHeading>
      <SectionIntro sectionId="credits">{intro}</SectionIntro>

      {hasAny ? (
        <div className="space-y-12">
          <LogoGrid items={credits} heading={t('credits.groupCredits').toLocaleUpperCase(locale)} logoBrightness={logoBrightness} />
          <LogoGrid items={endorsements} heading={t('credits.groupEndorsements').toLocaleUpperCase(locale)} logoBrightness={logoBrightness} />
          <LogoGrid items={partners} heading={t('credits.groupPartners').toLocaleUpperCase(locale)} logoBrightness={logoBrightness} />
        </div>
      ) : (
        <SectionEmpty label={t('credits.empty')} />
      )}
    </SectionWrapper>
  )
}
