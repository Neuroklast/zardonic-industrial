import { formatSectionHeading } from '@/lib/section-display'
import { SectionWrapper, SectionEmpty, SectionHeading, SectionIntro } from './SectionWrapper'
import { SquareImageGrid } from './SquareImageGrid'

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
}

export function SoundpacksSection({ items, heading, intro }: SoundpacksSectionProps) {
  const title = formatSectionHeading(heading, 'soundpacks')

  return (
    <SectionWrapper id="soundpacks" data-theme-color="foreground card border primary">
      <SectionHeading sectionId="soundpacks" dataText={title}>{title}</SectionHeading>
      <SectionIntro sectionId="soundpacks">{intro}</SectionIntro>
      {items.length > 0 ? (
        <SquareImageGrid items={items} />
      ) : (
        <SectionEmpty label="Soundpacks coming soon" />
      )}
    </SectionWrapper>
  )
}