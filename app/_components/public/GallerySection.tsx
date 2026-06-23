'use client'

import { m } from 'framer-motion'
import { MagnifyingGlassPlus } from '@phosphor-icons/react'
import { SectionWrapper, SectionEmpty } from './SectionWrapper'

interface GalleryItem {
  id: string
  alt: string | null
  imageUrl: string | null
}

interface GallerySectionProps {
  items: GalleryItem[]
  columns?: string
  maxVisible?: number
  aspectRatio?: string
  gap?: string
}

export function GallerySection({ items, columns = '3', maxVisible, aspectRatio, gap }: GallerySectionProps) {
  const visibleItems = items.filter((item) => item.imageUrl)

  return (
    <SectionWrapper id="gallery" data-theme-color="card border primary">
      <div className="mb-12 flex items-center justify-between gap-4">
        <h2
          className="hover-chromatic hover-glitch cyber2077-scan-build cyber2077-data-corrupt font-mono text-4xl font-bold uppercase tracking-tighter text-foreground md:text-6xl"
          data-text="GALLERY"
        >
          GALLERY
          <span className="animate-pulse">_</span>
        </h2>
      </div>

      {visibleItems.length > 0 ? (
        <div
          className={`grid ${columns === '2' ? 'grid-cols-2' : columns === '4' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} ${gap ? '' : 'gap-4'}`}
          style={{
            gap: gap || undefined,
            aspectRatio: aspectRatio || undefined,
          }}
        >
          {(maxVisible ? visibleItems.slice(0, maxVisible) : visibleItems).map((item, index) => (
            <m.div
              key={item.id}
              initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
              whileInView={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="glitch-image group relative aspect-square overflow-hidden bg-muted"
            >
              <img
                src={item.imageUrl ?? ''}
                alt={item.alt ?? ''}
                className="hover-chromatic-image h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <MagnifyingGlassPlus className="h-8 w-8 text-foreground" />
              </div>
            </m.div>
          ))}
        </div>
      ) : (
        <SectionEmpty label="Gallery coming soon" />
      )}
    </SectionWrapper>
  )
}
