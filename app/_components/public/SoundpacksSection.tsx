import { SectionWrapper } from './SectionWrapper'
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
  if (items.length === 0) return null
  return (
    <SectionWrapper id="soundpacks" heading="Soundpacks &amp; Presets">
      <SquareImageGrid items={items} />
    </SectionWrapper>
  )
}
