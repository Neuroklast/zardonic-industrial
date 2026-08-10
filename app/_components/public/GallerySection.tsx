'use client'

import { useState, useCallback, useMemo } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { MagnifyingGlassPlus, CaretDown, CaretUp } from '@phosphor-icons/react'
import { useLocale } from '@/contexts/LocaleContext'
import { resolveSectionHeading } from '@/lib/section-display'
import { SectionWrapper, SectionEmpty, SectionHeading, SectionIntro } from './SectionWrapper'
import CyberpunkOverlay from '@/components/CyberpunkOverlay'
import type { CyberpunkOverlayState } from '@/lib/app-types'
import { resolveGalleryTileAspect } from '@/lib/gallery-aspect-ratio'
import { toDirectImageUrl } from '@/lib/image-cache'

interface GalleryItem {
  id: string
  alt: string | null
  imageUrl: string | null
}

interface GallerySectionProps {
  items: GalleryItem[]
  heading?: string
  intro?: string
  columns?: string
  maxVisible?: number
  aspectRatio?: string
  gap?: string
  lightbox?: boolean
}

export function GallerySection({
  items,
  heading,
  intro,
  columns = '3',
  maxVisible,
  aspectRatio,
  gap,
  lightbox = true,
}: GallerySectionProps) {
  const { t } = useLocale()
  const title = resolveSectionHeading(heading, 'gallery', t)
  const [showAll, setShowAll] = useState(false)
  const [overlay, setOverlay] = useState<CyberpunkOverlayState | null>(null)
  const prefersReducedMotion = useReducedMotion()

  const visibleItems = useMemo(
    () => items.filter((item) => Boolean(item.imageUrl)),
    [items],
  )
  const capped = maxVisible && !showAll ? visibleItems.slice(0, maxVisible) : visibleItems

  // Full-resolution URLs for lightbox (no heavy wsrv resize)
  const lightboxUrls = useMemo(
    () =>
      visibleItems.map(
        (item) => toDirectImageUrl(item.imageUrl, { w: 1600, q: 85 }) || item.imageUrl || '',
      ),
    [visibleItems],
  )

  const lightboxAlts = useMemo(
    () => visibleItems.map((item) => item.alt ?? ''),
    [visibleItems],
  )

  const tileAspect = resolveGalleryTileAspect(aspectRatio)

  const openLightbox = useCallback(
    (itemId: string) => {
      if (!lightbox) return
      const fullIndex = visibleItems.findIndex((item) => item.id === itemId)
      if (fullIndex < 0) return
      setOverlay({
        type: 'gallery',
        data: {
          images: lightboxUrls,
          initialIndex: fullIndex,
          alts: lightboxAlts,
        },
      })
    },
    [lightbox, visibleItems, lightboxUrls, lightboxAlts],
  )

  return (
    <>
      <SectionWrapper id="gallery" data-theme-color="card border primary">
        <SectionHeading sectionId="gallery" dataText={title}>
          {title}
        </SectionHeading>
        <SectionIntro sectionId="gallery">{intro}</SectionIntro>

        {visibleItems.length > 0 ? (
          <>
            <div
              className={`grid ${columns === '2' ? 'grid-cols-2' : columns === '4' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} ${gap ? '' : 'gap-4'}`}
              style={{ gap: gap || undefined }}
            >
              {capped.map((item, index) => {
                const thumb =
                  toDirectImageUrl(item.imageUrl, { w: 640, q: 75 }) || item.imageUrl || ''
                return (
                  <m.div
                    key={item.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                    whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={prefersReducedMotion ? undefined : { once: true, margin: '40px' }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.4, delay: Math.min(index * 0.04, 0.3) }
                    }
                    className={`group relative overflow-hidden border border-border bg-muted ${tileAspect.className} ${lightbox ? 'cursor-pointer' : ''}`}
                    onClick={() => openLightbox(item.id)}
                    onKeyDown={(e) => {
                      if (lightbox && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        openLightbox(item.id)
                      }
                    }}
                    role={lightbox ? 'button' : undefined}
                    tabIndex={lightbox ? 0 : undefined}
                    aria-label={
                      lightbox ? `Open ${item.alt ?? 'gallery image'} in lightbox` : undefined
                    }
                  >
                    <img
                      src={thumb}
                      alt={item.alt ?? ''}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    {lightbox ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <MagnifyingGlassPlus className="h-8 w-8 text-foreground" aria-hidden />
                      </div>
                    ) : null}
                  </m.div>
                )
              })}
            </div>

            {maxVisible && visibleItems.length > maxVisible ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAll((value) => !value)}
                  className="cyber-border inline-flex min-h-[44px] items-center gap-2 px-4 py-2 uppercase"
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
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
      </SectionWrapper>

      {/* Same CyberpunkOverlay shell as releases / events */}
      <CyberpunkOverlay
        overlay={overlay}
        onClose={() => setOverlay(null)}
        adminSettings={undefined}
      />
    </>
  )
}
