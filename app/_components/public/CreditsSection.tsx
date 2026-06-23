'use client'

import { m } from 'framer-motion'

interface PartnerItem {
  id: string
  name: string
  url: string | null
  logoUrl: string | null
  category: string
}

interface CreditsAndEndorsementsProps {
  credits: PartnerItem[]
  endorsements: PartnerItem[]
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
              className="chromatic-hover h-10 w-auto object-contain transition-opacity hover:opacity-100 md:h-14"
              style={logoBrightness !== undefined ? { filter: `brightness(${logoBrightness})` } : { opacity: 0.7 }}
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

export function CreditsSection({ credits, endorsements, logoBrightness }: CreditsAndEndorsementsProps) {
  const hasItems = credits.length > 0 || endorsements.length > 0

  return (
    <section
      id="credits"
      className="scanline-effect py-section px-card"
      style={{ zIndex: 'var(--z-content)' }}
      data-theme-color="primary accent card border"
    >
      <div className="container mx-auto max-w-6xl">
        <m.div
          initial={{ opacity: 0, x: -30, filter: 'blur(10px)', clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
            <h2
              className="hover-chromatic hover-glitch cyber2077-scan-build cyber2077-data-corrupt font-mono text-heading font-bold uppercase tracking-tighter text-foreground"
              data-text="CREDIT HIGHLIGHTS"
            >
              CREDIT HIGHLIGHTS
              <span className="animate-pulse">_</span>
            </h2>
          </div>

          {hasItems ? (
            <div className="space-y-12">
              <LogoGrid items={credits} heading="CREDITS" logoBrightness={logoBrightness} />
              <LogoGrid items={endorsements} heading="ENDORSEMENTS" logoBrightness={logoBrightness} />
            </div>
          ) : (
            <div className="border border-border bg-card/50 p-12 text-center font-mono text-xl uppercase tracking-wide text-muted-foreground">
              Credits and endorsements coming soon
            </div>
          )}
        </m.div>
      </div>
    </section>
  )
}
