import { SectionWrapper, SectionEmpty, SectionHeading } from './SectionWrapper'
import { SquareImageGrid } from './SquareImageGrid'

interface SoundpackItem {
  id: string
  title: string
  imageUrl: string | null
  externalUrl: string | null
}

interface SoundpacksSectionProps {
  items: SoundpackItem[]
}

export function SoundpacksSection({ items }: SoundpacksSectionProps) {
  return (
    <SectionWrapper id="soundpacks" data-theme-color="foreground card border primary">
      <SectionHeading dataText="SOUNDPACKS & PRESETS">SOUNDPACKS & PRESETS</SectionHeading>
      {items.length > 0 ? (
        <SquareImageGrid items={items} />
      ) : (
        <SectionEmpty label="Soundpacks coming soon" />
      )}
    </SectionWrapper>
  )
}