'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The frame always keeps its desktop layout. Only the visible crop is scaled,
 * including the form controls, so smaller footer columns cannot clip the
 * button independently of the email field.
 *
 * External-site caveat: the offset is relative to Bandzoogle's full-page
 * layout and must be verified against the live provider site. This cannot
 * read or adapt to Bandzoogle DOM changes because the frame is cross-origin.
 */
const BANDZOOGLE_URL = 'https://zardonic.bandzoogle.com/'
const FRAME_WIDTH = 1100
const FRAME_HEIGHT = 1400
const FORM_TOP_OFFSET = 560
const CROP_WIDTH = 356
const CROP_HEIGHT = 92

export function BandzoogleMailingListEmbed() {
  const cropRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const crop = cropRef.current
    if (!crop) return

    const updateScale = () => {
      const width = crop.getBoundingClientRect().width
      if (width > 0) {
        setScale(Math.min(1, width / CROP_WIDTH))
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateScale)
      : null
    observer?.observe(crop)

    return () => {
      window.removeEventListener('resize', updateScale)
      observer?.disconnect()
    }
  }, [])

  return (
    <div
      ref={cropRef}
      className="relative w-full max-w-[356px] overflow-hidden bg-black"
      style={{ height: CROP_HEIGHT * scale }}
      aria-label="Official Zardonic mailing list"
      data-testid="bandzoogle-mailing-list-crop"
    >
      <iframe
        title="Join the official Zardonic mailing list"
        src={BANDZOOGLE_URL}
        loading="lazy"
        referrerPolicy="no-referrer"
        scrolling="no"
        className="absolute border-0"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          left: '50%',
          top: -FORM_TOP_OFFSET * scale,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'top center',
        }}
      />
      <a
        href={BANDZOOGLE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="sr-only focus:not-sr-only focus:absolute focus:inset-x-0 focus:bottom-0 focus:z-10 focus:bg-black focus:p-2 focus:text-center focus:text-white"
      >
        Open the Zardonic mailing list directly
      </a>
    </div>
  )
}
