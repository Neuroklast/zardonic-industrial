'use client'

import { m } from 'framer-motion'
import { formatSectionHeading } from '@/lib/section-display'
import { SectionWrapper, SectionEmpty, SectionHeading, SectionIntro } from './SectionWrapper'

interface PartnerItem {
  id: string
  name: string
  url: string | null
  logoUrl: string | null
  category: string
  logoWhite?: boolean
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
  const brightness = logoBrightness !== undefined ? Math.min(Math.max(logoBrightness, 0.2), 1) : 0.85

  if (useWhite) {
    // Alpha-aware white: mask solid white with the PNG alpha channel
    return (
      <m.span
        role="img"
        aria-label={item.name}
        className="logo-white-mask h-10 w-24 max-w-full md:h-14 md:w-28"
        style={
          {
            ['--logo-mask' as string]: `url("${item.logoUrl}")`,
            ['--logo-brightness' as string]: String(brightness),
          } as React.CSSProperties
        }
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      />
    )
  }

  return (
    <m.img
      src={item.logoUrl}
      alt={item.name}
      className="chromatic-hover h-10 w-auto object-contain transition-opacity hover:opacity-100 md:h-14"
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
          const content = (
            <PartnerLogo item={item} logoBrightness={logoBrightness} />
          )
          const wrapperClassName = 'flex min-h-24 items-center justify-center p-2'

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
