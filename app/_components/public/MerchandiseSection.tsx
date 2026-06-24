import { formatSectionHeading } from '@/lib/section-display'
import { SectionWrapper, SectionEmpty, SectionHeading, SectionIntro } from './SectionWrapper'
import { SquareImageGrid } from './SquareImageGrid'

interface GridItem {
  id: string
  title: string
  imageUrl: string | null
  externalUrl: string | null
}

interface MerchandiseSectionProps {
  items: GridItem[]
  heading?: string
  intro?: string
  footerText: string
}

export function MerchandiseSection({ items, heading, intro, footerText }: MerchandiseSectionProps) {
  const title = formatSectionHeading(heading, 'merchandise')

  return (
    <SectionWrapper id="merch" data-theme-color="foreground card border primary">
      <SectionHeading sectionId="merchandise" dataText={title}>{title}</SectionHeading>
      <SectionIntro sectionId="merchandise">{intro}</SectionIntro>
      {items.length > 0 ? (
        <SquareImageGrid items={items} footerText={footerText} />
      ) : (
        <SectionEmpty label="Merchandise coming soon" />
      )}
    </SectionWrapper>
  )
}