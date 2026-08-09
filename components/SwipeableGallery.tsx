'use client'

import { useState, useCallback, memo, useEffect, useRef } from 'react'
import type React from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react'

interface SwipeableGalleryProps {
  images: string[]
  initialIndex: number
  onClose: () => void
}

const swipeConfidenceTolerance = 8000
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity

export const SwipeableGallery = memo(function SwipeableGallery({
  images,
  initialIndex,
  onClose,
}: SwipeableGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [[page, direction], setPage] = useState([initialIndex, 0])
  const preloadRef = useRef<Set<string>>(new Set())

  // Preload neighbors for snappy swipes
  useEffect(() => {
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

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') paginate(1)
      if (event.key === 'ArrowLeft') paginate(-1)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
    // paginate is stable enough via setState; include images.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, images.length, currentIndex])

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

  if (images.length === 0) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-md cyberpunk-overlay-bg"
        style={{ zIndex: 'var(--z-modal-backdrop)' } as React.CSSProperties}
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 flex items-center justify-center p-3 md:p-8"
        style={{ zIndex: 'var(--z-overlay)' } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label="Gallery lightbox"
      >
        {/* Cyber frame */}
        <div className="cyber-border relative flex h-[min(88dvh,900px)] w-full max-w-6xl flex-col overflow-hidden border border-primary/30 bg-background/90 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-primary" />
          <div className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-primary" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-primary" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-primary" />

          <div
            className="flex items-center justify-between border-b border-border/50 px-4 py-2"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              // GALLERY.VIEW [{currentIndex + 1}/{images.length}]
            </span>
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              onClick={onClose}
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <button
              type="button"
              className="absolute left-1 top-1/2 z-10 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:left-3"
              onClick={() => paginate(-1)}
              aria-label="Previous image"
            >
              <CaretLeft className="h-10 w-10" />
            </button>

            <div className="relative h-full w-full overflow-hidden px-10 md:px-16">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.img
                  key={page}
                  src={images[currentIndex]}
                  alt=""
                  custom={direction}
                  variants={variants}
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
              className="absolute right-1 top-1/2 z-10 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:right-3"
              onClick={() => paginate(1)}
              aria-label="Next image"
            >
              <CaretRight className="h-10 w-10" />
            </button>
          </div>

          <div className="flex justify-center gap-0.5 border-t border-border/50 px-2 py-2">
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
      </motion.div>
    </>
  )
})

const variants = {
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

export default SwipeableGallery
