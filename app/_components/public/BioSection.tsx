'use client'

import { useState } from 'react'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import { useLocale } from '@/contexts/LocaleContext'
import { asDisplayString } from '@/lib/safe-string'
import { resolveSectionHeading } from '@/lib/section-display'
import { SectionWrapper, SectionHeading, SectionIntro } from './SectionWrapper'

interface BioSectionProps {
  /** Biography body text from Supabase `bio.content`. Non-strings are coerced safely. */
  content: string | null | undefined
  heading?: string
  intro?: string
  bodyFontSize?: string
  readMoreMaxHeight?: string
}

export function BioSection({ content, heading, intro, bodyFontSize, readMoreMaxHeight }: BioSectionProps) {
  const { t } = useLocale()
  const title = resolveSectionHeading(heading, 'bio', t)
  const [expanded, setExpanded] = useState(false)
  // Never call .trim() on non-strings — that threw and tripped SectionErrorBoundary
  const safeContent = asDisplayString(content)
  const hasContent = safeContent.trim().length > 0
  const displayContent = hasContent ? safeContent : t('bio.empty')

  const bioTextClass =
    typeof bodyFontSize === 'string' && bodyFontSize.trim() ? bodyFontSize : 'text-lg'
  const maxH =
    typeof readMoreMaxHeight === 'string' && readMoreMaxHeight.trim()
      ? readMoreMaxHeight
      : '280px'
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
                <CaretUp className="h-4 w-4" aria-hidden />
                {t('bio.showLess')}
              </>
            ) : (
              <>
                <CaretDown className="h-4 w-4" aria-hidden />
                {t('bio.readMore')}
              </>
            )}
          </button>
        </div>
      ) : null}
    </SectionWrapper>
  )
}