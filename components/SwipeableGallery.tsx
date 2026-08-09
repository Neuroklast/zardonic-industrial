'use client'

import { useState, useCallback, memo, useEffect, useRef, useMemo } from 'react'
import type React from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import { getRandomOverlayAnimation } from '@/lib/overlay-animations'
import { useLenisContext } from '@/contexts/LenisContext'

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
  const { lenis } = useLenisContext()

  // Same open/close language as releases / events overlays
  const anim = useMemo(() => getRandomOverlayAnimation(), [])

  // Preload neighbors
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

  // Hard scroll lock (body + Lenis) so the modal cannot be scrolled away
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    lenis?.stop()

    const preventScroll = (e: Event) => {
      // Allow vertical wheel only inside the image area is unnecessary — block page scroll entirely
      e.preventDefault()
    }
    // Capture phase so Lenis / nested handlers cannot scroll the page
    window.addEventListener('wheel', preventScroll, { passive: false, capture: true })
    window.addEventListener('touchmove', preventScroll, { passive: false, capture: true })

    return () => {
      document.body.style.overflow = prevOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.touchAction = ''
      lenis?.start()
      window.removeEventListener('wheel', preventScroll, { capture: true } as EventListenerOptions)
      window.removeEventListener('touchmove', preventScroll, { capture: true } as EventListenerOptions)
    }
  }, [lenis])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') paginate(1)
      if (event.key === 'ArrowLeft') paginate(-1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
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
        initial={anim.backdrop.initial}
        animate={anim.backdrop.animate}
        exit={anim.backdrop.exit}
        transition={anim.backdrop.transition ?? { duration: 0.25 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm cyberpunk-overlay-bg"
        style={{ zIndex: 'var(--z-modal-backdrop)' } as React.CSSProperties}
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        initial={anim.modal.initial}
        animate={anim.modal.animate}
        exit={anim.modal.exit}
        transition={anim.modal.transition ?? { duration: 0.35 }}
        className="fixed inset-0 flex items-end justify-center p-0 pointer-events-none md:items-center md:p-8"
        style={
          {
            zIndex: 'var(--z-overlay)',
            perspective: '1000px',
          } as React.CSSProperties
        }
        role="dialog"
        aria-modal="true"
        aria-label="Gallery lightbox"
      >
        <div
          className="pointer-events-auto relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden border border-primary/30 bg-background/95 shadow-[0_0_60px_rgba(0,0,0,0.85)] md:h-[min(88dvh,900px)] md:rounded-[var(--radius)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-primary" />
          <div className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-primary" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-primary" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-primary" />

          <div
            className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-2"
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
              className="absolute right-1 top-1/2 z-10 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:right-3"
              onClick={() => paginate(1)}
              aria-label="Next image"
            >
              <CaretRight className="h-10 w-10" />
            </button>
          </div>

          <div className="flex shrink-0 justify-center gap-0.5 border-t border-border/50 px-2 py-2">
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

export default SwipeableGallery
