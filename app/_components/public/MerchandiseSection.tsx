import { SectionWrapper } from './SectionWrapper'
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
  if (items.length === 0) return null
  return (
    <SectionWrapper id="merch" heading="Merchandise">
      <SquareImageGrid items={items} footerText={footerText} />
    </SectionWrapper>
  )
}
