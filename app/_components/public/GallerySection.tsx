'use client'

import { m } from 'framer-motion'
import { MagnifyingGlassPlus } from '@phosphor-icons/react'

interface GalleryItem {
  id: string
  title: string
  imageUrl: string | null
}

interface GallerySectionProps {
  items: GalleryItem[]
}

export function GallerySection({ items }: GallerySectionProps) {
  const visibleItems = items.filter((item) => item.imageUrl)
  if (visibleItems.length === 0) return null

  return (
    <section
      id="gallery"
      className="scanline-effect py-section px-card"
      style={{ zIndex: 'var(--z-content)' }}
      data-theme-color="card border primary"
    >
      <div className="container mx-auto max-w-6xl">
        <m.div
          initial={{ opacity: 0, x: -30, filter: 'blur(10px)', clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="mb-12 flex items-center justify-between gap-4">
            <h2
              className="hover-chromatic hover-glitch cyber2077-scan-build cyber2077-data-corrupt font-mono text-4xl font-bold uppercase tracking-tighter text-foreground md:text-6xl"
              data-text="GALLERY"
            >
              GALLERY
              <span className="animate-pulse">_</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {visibleItems.map((item, index) => (
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
                  alt={item.title}
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
        </m.div>
      </div>
    </section>
  )
}
