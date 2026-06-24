'use client'

import { m } from 'framer-motion'
import { SectionWrapper, SectionEmpty, SectionHeading } from './SectionWrapper'

interface PartnerItem {
  id: string
  name: string
  url: string | null
  logoUrl: string | null
  category: string
  logoWhite?: boolean
}

function logoImageClassName(item: PartnerItem): string {
  const base = 'h-10 w-auto object-contain transition-opacity hover:opacity-100 md:h-14'
  const useWhiteFill = item.logoWhite !== false
  return useWhiteFill ? `logo-white ${base}` : `chromatic-hover ${base}`
}

function logoImageStyle(item: PartnerItem, logoBrightness?: number): React.CSSProperties {
  if (item.logoWhite !== false) {
    if (logoBrightness !== undefined) {
      return { ['--logo-brightness' as string]: String(logoBrightness) }
    }
    return {}
  }
  return logoBrightness !== undefined ? { filter: `brightness(${logoBrightness})` } : { opacity: 0.7 }
}

interface CreditsAndEndorsementsProps {
  credits: PartnerItem[]
  endorsements: PartnerItem[]
  partners?: PartnerItem[]
  logoBrightness?: number
}

function LogoGrid({ items, heading, logoBrightness }: { items: PartnerItem[]; heading: string; logoBrightness?: number }) {
  if (items.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="data-label" data-theme-color="data-label">
        // {heading}
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item, index) => {
          const content = item.logoUrl ? (
            <m.img
              src={item.logoUrl}
              alt={item.name}
              className={logoImageClassName(item)}
              style={logoImageStyle(item, logoBrightness)}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: logoBrightness !== undefined ? Math.min(logoBrightness + 0.3, 1) : 0.7, y: 0 }}
              whileHover={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <m.span
              className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              {item.name}
            </m.span>
          )

          const wrapperClassName = 'flex min-h-24 items-center justify-center p-2'

          return item.url ? (
            <m.a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.name}
              title={item.name}
              className={wrapperClassName}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              {content}
            </m.a>
          ) : (
            <m.div
              key={item.id}
              className={wrapperClassName}
              title={item.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              {content}
            </m.div>
          )
        })}
      </div>
    </div>
  )
}

export function CreditsSection({ credits, endorsements, partners = [], logoBrightness }: CreditsAndEndorsementsProps) {
  const hasItems = credits.length > 0 || endorsements.length > 0 || partners.length > 0

  return (
    <SectionWrapper id="credits" data-theme-color="primary accent card border">
      <SectionHeading dataText="CREDIT HIGHLIGHTS">CREDIT HIGHLIGHTS</SectionHeading>

      {hasItems ? (
        <div className="space-y-12">
          <LogoGrid items={credits} heading="CREDITS" logoBrightness={logoBrightness} />
          <LogoGrid items={endorsements} heading="ENDORSEMENTS" logoBrightness={logoBrightness} />
          <LogoGrid items={partners} heading="PARTNERS & FRIENDS" logoBrightness={logoBrightness} />
        </div>
      ) : (
        <SectionEmpty label="Credits and endorsements coming soon" />
      )}
    </SectionWrapper>
  )
}
