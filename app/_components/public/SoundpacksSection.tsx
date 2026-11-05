'use client'

import { useLocale } from '@/contexts/LocaleContext'
import { resolveSectionHeading } from '@/lib/section-display'
import { SectionWrapper, SectionEmpty, SectionHeading, SectionIntro } from './SectionWrapper'
import { SquareImageGrid } from './SquareImageGrid'
import { SectionMoreLink } from './SectionMoreLink'

interface SoundpackItem {
  id: string
  title: string
  imageUrl: string | null
  externalUrl: string | null
}

interface SoundpacksSectionProps {
  items: SoundpackItem[]
  heading?: string
  intro?: string
  maxItems?: number
}

export function SoundpacksSection({ items, heading, intro, maxItems = 8 }: SoundpacksSectionProps) {
  const { t } = useLocale()
  const title = resolveSectionHeading(heading, 'soundpacks', t)
  const limit = Math.max(1, Math.min(48, maxItems))

  return (
    <SectionWrapper id="soundpacks" data-theme-color="foreground card border primary">
      <SectionHeading sectionId="soundpacks" dataText={title}>{title}</SectionHeading>
      <SectionIntro sectionId="soundpacks">{intro}</SectionIntro>
      {items.length > 0 ? (
        <>
          <SquareImageGrid items={items.slice(0, limit)} />
          <SectionMoreLink href="/soundpacks" count={items.length} />
        </>
      ) : (
        <SectionEmpty label="Soundpacks coming soon" />
      )}
    </SectionWrapper>
  )
}