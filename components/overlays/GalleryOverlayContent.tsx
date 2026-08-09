'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import type { GalleryOverlayData } from '@/lib/app-types'

interface GalleryOverlayContentProps {
  data: GalleryOverlayData
}

const swipeConfidenceTolerance = 8000
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity

const imageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 320 : -320,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 320 : -320,
    opacity: 0,
  }),
}

/**
 * Gallery lightbox body — rendered inside CyberpunkOverlay (same chrome as
 * releases / events). Only the image stage + controls live here.
 */
export function GalleryOverlayContent({ data }: GalleryOverlayContentProps) {
  const { images, initialIndex, alts } = data
  // initialIndex is fixed for an overlay session (session key includes it)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [[page, direction], setPage] = useState([initialIndex, 0])
  const preloadRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (images.length === 0) return
    const toLoad = [
      images[currentIndex],
      images[(currentIndex + 1) % images.length],
      images[(currentIndex - 1 + images.length) % images.length],
    ].filter(Boolean) as string[]

    for (const src of toLoad) {
      if (preloadRef.current.has(src)) continue
      preloadRef.current.add(src)
      const img = new window.Image()
      img.decoding = 'async'
      img.src = src
    }
  }, [currentIndex, images])

  const paginate = useCallback(
    (newDirection: number) => {
      if (images.length === 0) return
      setCurrentIndex((prev) => {
        const newIndex = (prev + newDirection + images.length) % images.length
        setPage([newIndex, newDirection])
        return newIndex
      })
    },
    [images.length],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') paginate(1)
      if (event.key === 'ArrowLeft') paginate(-1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [paginate])

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
      const swipe = swipePower(offset.x, velocity.x)
      if (swipe < -swipeConfidenceTolerance || offset.x < -80) paginate(1)
      else if (swipe > swipeConfidenceTolerance || offset.x > 80) paginate(-1)
    },
    [paginate],
  )

  const handleDotClick = useCallback(
    (index: number) => {
      const newDirection = index > currentIndex ? 1 : -1
      setCurrentIndex(index)
      setPage([index, newDirection])
    },
    [currentIndex],
  )

  if (images.length === 0) {
    return <p className="font-mono text-sm text-muted-foreground">No gallery images.</p>
  }

  const alt = alts?.[currentIndex] ?? ''

  return (
    <div className="flex min-h-[min(60vh,520px)] flex-col">
      <div
        className="mb-4 data-label text-center"
        style={{ fontFamily: 'var(--font-mono, monospace)' }}
      >
        // GALLERY.VIEW [{currentIndex + 1}/{images.length}]
      </div>

      <div className="relative flex min-h-[min(50vh,440px)] flex-1 items-center justify-center">
        <button
          type="button"
          className="absolute left-0 top-1/2 z-10 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-primary md:left-1"
          onClick={() => paginate(-1)}
          aria-label="Previous image"
        >
          <CaretLeft className="h-10 w-10" />
        </button>

        <div className="relative h-[min(55vh,480px)] w-full overflow-hidden px-12 md:px-16">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.img
              key={page}
              src={images[currentIndex]}
              alt={alt}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 320, damping: 32 },
                opacity: { duration: 0.15 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.85}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 m-auto max-h-full max-w-full cursor-grab object-contain active:cursor-grabbing"
              decoding="async"
              draggable={false}
            />
          </AnimatePresence>
        </div>

        <button
          type="button"
          className="absolute right-0 top-1/2 z-10 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-primary md:right-1"
          onClick={() => paginate(1)}
          aria-label="Next image"
        >
          <CaretRight className="h-10 w-10" />
        </button>
      </div>

      <div className="mt-4 flex shrink-0 justify-center gap-0.5 px-2">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            className="inline-flex min-h-[40px] min-w-[28px] items-center justify-center"
            onClick={() => handleDotClick(index)}
            aria-label={`Go to image ${index + 1}`}
            aria-current={index === currentIndex ? 'true' : undefined}
          >
            <span
              className={`block h-1.5 w-1.5 rounded-full transition-all ${
                index === currentIndex ? 'w-4 bg-primary' : 'bg-muted-foreground/40'
              }`}
              aria-hidden
            />
          </button>
        ))}
      </div>
    </div>
  )
}
