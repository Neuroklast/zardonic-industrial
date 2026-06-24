import { SectionWrapper, SectionEmpty, SectionHeading } from './SectionWrapper'
import { SquareImageGrid } from './SquareImageGrid'

interface GridItem {
  id: string
  title: string
  imageUrl: string | null
  externalUrl: string | null
}

interface MerchandiseSectionProps {
  items: GridItem[]
  footerText: string
}

export function MerchandiseSection({ items, footerText }: MerchandiseSectionProps) {
  return (
    <SectionWrapper id="merch" data-theme-color="foreground card border primary">
      <SectionHeading dataText="MERCHANDISE">MERCHANDISE</SectionHeading>
      {items.length > 0 ? (
        <SquareImageGrid items={items} footerText={footerText} />
      ) : (
        <SectionEmpty label="Merchandise coming soon" />
      )}
    </SectionWrapper>
  )
}