'use client'

import { useState } from 'react'
import { m, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MagnifyingGlassPlus, CaretDown, CaretUp } from '@phosphor-icons/react'
import { SectionWrapper, SectionEmpty, SectionHeading } from './SectionWrapper'
import SwipeableGallery from '@/components/SwipeableGallery'
import { resolveGalleryTileAspect } from '@/lib/gallery-aspect-ratio'

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
  lightbox?: boolean
}

export function GallerySection({
  items,
  columns = '3',
  maxVisible,
  aspectRatio,
  gap,
  lightbox = true,
}: GallerySectionProps) {
  const [showAll, setShowAll] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const prefersReducedMotion = useReducedMotion()

  const visibleItems = items.filter((item) => item.imageUrl)
  const capped = maxVisible && !showAll ? visibleItems.slice(0, maxVisible) : visibleItems
  const imageUrls = visibleItems.map((item) => item.imageUrl ?? '')
  const tileAspect = resolveGalleryTileAspect(aspectRatio)

  function openLightbox(index: number) {
    if (!lightbox) return
    setLightboxIndex(index)
  }

  return (
    <SectionWrapper id="gallery" data-theme-color="card border primary">
      <SectionHeading dataText="GALLERY">GALLERY</SectionHeading>

      {visibleItems.length > 0 ? (
        <>
          <div
            className={`grid ${columns === '2' ? 'grid-cols-2' : columns === '4' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} ${gap ? '' : 'gap-4'}`}
            style={{ gap: gap || undefined }}
          >
            {capped.map((item, index) => (
              <m.div
                key={item.id}
                initial={prefersReducedMotion ? false : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
                whileInView={prefersReducedMotion ? undefined : { opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
                viewport={prefersReducedMotion ? undefined : { once: true }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.6, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }
                }
                className={`glitch-image group relative overflow-hidden bg-muted ${tileAspect.className} ${lightbox ? 'cursor-pointer' : ''}`}
                onClick={() => openLightbox(index)}
                onKeyDown={(e) => {
                  if (lightbox && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    openLightbox(index)
                  }
                }}
                role={lightbox ? 'button' : undefined}
                tabIndex={lightbox ? 0 : undefined}
                aria-label={lightbox ? `Open ${item.alt ?? 'gallery image'} in lightbox` : undefined}
              >
                <img
                  src={item.imageUrl ?? ''}
                  alt={item.alt ?? ''}
                  className="hover-chromatic-image h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {lightbox ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <MagnifyingGlassPlus className="h-8 w-8 text-foreground" aria-hidden />
                  </div>
                ) : null}
              </m.div>
            ))}
          </div>

          {maxVisible && visibleItems.length > maxVisible ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAll((value) => !value)}
                className="cyber-border hover-glitch inline-flex min-h-[44px] items-center gap-2 px-4 py-2 font-mono uppercase"
              >
                {showAll ? (
                  <>
                    <CaretUp className="h-4 w-4" aria-hidden />
                    Show Less
                  </>
                ) : (
                  <>
                    <CaretDown className="h-4 w-4" aria-hidden />
                    Show All ({visibleItems.length})
                  </>
                )}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <SectionEmpty label="Gallery coming soon" />
      )}

      <AnimatePresence>
        {lightbox && lightboxIndex !== null ? (
          <SwipeableGallery
            images={imageUrls}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        ) : null}
      </AnimatePresence>
    </SectionWrapper>
  )
}