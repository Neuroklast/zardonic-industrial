import { useState, useRef } from 'react'
import { get } from '@/lib/config'

interface GlitchImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
}

/**
 * GlitchImage - Image component with glitch/slice effect on hover
 * Creates a digital tearing/slicing effect when hovering over the image
 */
export function GlitchImage({ src, alt, className = '', width, height }: GlitchImageProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [enabled] = useState(() => Boolean(get('IMAGE_GLITCH_ON_HOVER_ENABLED')))
  const imageRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (enabled) {
      setIsHovering(true)
      setTimeout(() => setIsHovering(false), get('IMAGE_GLITCH_DURATION_MS'))
    }
  }

  if (!enabled) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
      />
    )
  }

  const sliceCount = get('IMAGE_GLITCH_SLICE_COUNT')
  const duration = get('IMAGE_GLITCH_DURATION_MS')

  return (
    <div
      ref={imageRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      style={{ width, height }}
    >
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-all duration-150 ${
          isHovering ? 'brightness-125' : 'brightness-100'
        }`}
        width={width}
        height={height}
      />
      
      {isHovering && (
        <>
          {Array.from({ length: sliceCount }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 overflow-hidden"
              style={{
                top: `${(i / sliceCount) * 100}%`,
                height: `${100 / sliceCount}%`,
                animation: `glitch-slice-${i % 3} ${duration}ms ease-out`,
                animationDelay: `${i * (duration / sliceCount / 2)}ms`,
              }}
            >
              <img
                src={src}
                alt=""
                className="absolute h-full w-full object-cover"
                style={{
                  top: `${(-i / sliceCount) * 100}%`,
                  height: `${sliceCount * 100}%`,
                }}
              />
            </div>
          ))}
        </>
      )}
    </div>
  )
}
