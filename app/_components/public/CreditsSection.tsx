import Image from 'next/image'
import { SectionWrapper } from './SectionWrapper'

interface PartnerItem {
  id: string
  name: string
  url: string | null
  logoUrl: string | null
  category: string
}

interface CreditsAndEndorsementsProps {
  credits: PartnerItem[]
  endorsements: PartnerItem[]
}

function LogoGrid({ items, heading }: { items: PartnerItem[]; heading: string }) {
  if (items.length === 0) return null
  return (
    <div className="mb-12">
      <h3 className="font-mono text-xs tracking-widest text-zinc-600 uppercase mb-6">{heading}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
        {items.map((item) => {
          const inner = item.logoUrl ? (
            <div className="relative w-full aspect-square">
              <Image
                src={item.logoUrl}
                alt={item.name}
                fill
                className="object-contain opacity-70 hover:opacity-100 transition-opacity chromatic-hover"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
              />
            </div>
          ) : (
            <span className="font-mono text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-center">
              {item.name}
            </span>
          )

          return item.url ? (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2 hover:scale-105 transition-transform"
              aria-label={item.name}
              title={item.name}
            >
              {inner}
            </a>
          ) : (
            <div
              key={item.id}
              className="flex items-center justify-center p-2"
              title={item.name}
            >
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CreditsSection({ credits, endorsements }: CreditsAndEndorsementsProps) {
  if (credits.length === 0 && endorsements.length === 0) return null
  return (
    <SectionWrapper id="credits" heading="Credit Highlights">
      <LogoGrid items={credits} heading="Notable credits" />
      {endorsements.length > 0 && (
        <LogoGrid items={endorsements} heading="Endorsements" />
      )}
    </SectionWrapper>
  )
}
