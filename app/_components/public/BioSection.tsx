'use client'

import { useState } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import { formatSectionHeading } from '@/lib/section-display'
import { SectionWrapper, SectionHeading, SectionIntro } from './SectionWrapper'

interface BioSectionProps {
  content: string
  heading?: string
  intro?: string
  bodyFontSize?: string
  readMoreMaxHeight?: string
}

export function BioSection({ content, heading, intro, bodyFontSize, readMoreMaxHeight }: BioSectionProps) {
  const title = formatSectionHeading(heading, 'bio')
  const [expanded, setExpanded] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const hasContent = content.trim().length > 0
  const displayContent = hasContent ? content : 'Biography coming soon.'

  const bioTextClass = bodyFontSize || 'text-lg'
  const maxH = readMoreMaxHeight || '280px'

  return (
    <SectionWrapper id="bio" data-theme-color="foreground muted-foreground card border">
      <SectionHeading sectionId="bio" dataText={title}>{title}</SectionHeading>
      <SectionIntro sectionId="bio">{intro}</SectionIntro>

      <div
        className={`overflow-hidden whitespace-pre-wrap font-light ${bioTextClass} text-muted-foreground leading-relaxed`}
        style={{
          maxHeight: expanded ? 'none' : maxH,
          maskImage: expanded ? 'none' : 'linear-gradient(to bottom, black 60%, transparent 100%)',
          WebkitMaskImage: expanded ? 'none' : 'linear-gradient(to bottom, black 60%, transparent 100%)',
          transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), mask-image 0.3s ease, -webkit-mask-image 0.3s ease',
        }}
      >
        <m.div
          initial={prefersReducedMotion ? false : { opacity: 0, x: -30 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={prefersReducedMotion ? undefined : { once: true }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
          }
        >
          {displayContent}
        </m.div>
      </div>

      {hasContent ? (
        <m.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
          viewport={prefersReducedMotion ? undefined : { once: true }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.4 }}
          className="mt-6"
        >
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="cyber-border hover-glitch inline-flex min-h-[44px] items-center gap-2 px-4 py-2 font-mono"
          >
            {expanded ? (
              <>
                <CaretUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <CaretDown className="h-4 w-4" />
                Read More
              </>
            )}
          </button>
        </m.div>
      ) : null}
    </SectionWrapper>
  )
}