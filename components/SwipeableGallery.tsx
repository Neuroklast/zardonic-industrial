'use client'

import { useState, useCallback, memo, useEffect } from 'react'
import type React from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface SwipeableGalleryProps {
  images: string[]
  initialIndex: number
  onClose: () => void
}

export const SwipeableGallery = memo(function SwipeableGallery({ images, initialIndex, onClose }: SwipeableGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [[page, direction], setPage] = useState([initialIndex, 0])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const paginate = useCallback((newDirection: number) => {
    const newIndex = (currentIndex + newDirection + images.length) % images.length
    setCurrentIndex(newIndex)
    setPage([newIndex, newDirection])
  }, [currentIndex, images.length])

  const handleDragEnd = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipe = swipeConfidenceThreshold(offset.x, velocity.x)

    if (swipe < -swipeConfidenceTolerance) {
      paginate(1)
    } else if (swipe > swipeConfidenceTolerance) {
      paginate(-1)
    }
  }, [paginate])

  const handleDotClick = useCallback((index: number) => {
    const newDirection = index > currentIndex ? 1 : -1
    setCurrentIndex(index)
    setPage([index, newDirection])
  }, [currentIndex])

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-sm cyberpunk-overlay-bg"
        style={{ zIndex: 'var(--z-modal-backdrop)' } as React.CSSProperties}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 'var(--z-overlay)' } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label="Gallery lightbox"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 min-h-[44px] min-w-[44px] text-foreground hover:text-accent"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <X className="h-8 w-8" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 z-10 min-h-[44px] min-w-[44px] -translate-y-1/2 text-foreground hover:text-accent"
          onClick={() => paginate(-1)}
          aria-label="Previous image"
        >
          <CaretLeft className="h-12 w-12" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 z-10 min-h-[44px] min-w-[44px] -translate-y-1/2 text-foreground hover:text-accent"
          onClick={() => paginate(1)}
          aria-label="Next image"
        >
          <CaretRight className="h-12 w-12" />
        </Button>

        <div className="relative h-[80vh] w-full max-w-5xl overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
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
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={handleDragEnd}
              className="absolute h-full w-full cursor-grab object-contain active:cursor-grabbing"
            />
          </AnimatePresence>
        </div>

        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center"
              onClick={() => handleDotClick(index)}
              aria-label={`Go to image ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : undefined}
            >
              <span
                className={`swipe-dot ${index === currentIndex ? 'active' : ''}`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </motion.div>
    </>
  )
})

const swipeConfidenceTolerance = 10000
const swipeConfidenceThreshold = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity
}

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }
  },
}

export default SwipeableGallery