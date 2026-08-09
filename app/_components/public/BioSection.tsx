'use client'

import { useState } from 'react'
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
  const hasContent = content.trim().length > 0
  const displayContent = hasContent ? content : 'Biography coming soon.'

  const bioTextClass = bodyFontSize || 'text-lg'
  const maxH = readMoreMaxHeight || '280px'
  // Always show full content when short or expanded — avoid mask making text look "invisible"
  const clampCollapsed = hasContent && !expanded

  return (
    <SectionWrapper id="bio" data-theme-color="foreground muted-foreground card border">
      <SectionHeading sectionId="bio" dataText={title}>{title}</SectionHeading>
      <SectionIntro sectionId="bio">{intro}</SectionIntro>

      <div
        className={`overflow-hidden whitespace-pre-wrap font-light ${bioTextClass} text-muted-foreground leading-relaxed`}
        style={{
          fontFamily: 'var(--font-body, inherit)',
          maxHeight: clampCollapsed ? maxH : 'none',
          maskImage: clampCollapsed
            ? 'linear-gradient(to bottom, black 60%, transparent 100%)'
            : 'none',
          WebkitMaskImage: clampCollapsed
            ? 'linear-gradient(to bottom, black 60%, transparent 100%)'
            : 'none',
          transition:
            'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), mask-image 0.3s ease, -webkit-mask-image 0.3s ease',
        }}
      >
        {displayContent}
      </div>

      {hasContent ? (
        <div className="mt-6">
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
        </div>
      ) : null}
    </SectionWrapper>
  )
}