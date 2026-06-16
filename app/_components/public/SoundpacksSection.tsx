import Image from 'next/image'
import { SectionWrapper } from './SectionWrapper'

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.externalUrl ?? '#'}
            target={item.externalUrl ? '_blank' : undefined}
            rel={item.externalUrl ? 'noopener noreferrer' : undefined}
            className="group block"
            aria-label={item.title}
          >
            <div className="relative aspect-square bg-zinc-900 overflow-hidden border border-zinc-800 group-hover:border-zinc-600 transition-colors">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-mono text-xs text-zinc-700">NO IMAGE</span>
                </div>
              )}
            </div>
            <p className="mt-2 font-mono text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
              {item.title}
            </p>
          </a>
        ))}
      </div>
    </SectionWrapper>
  )
}
