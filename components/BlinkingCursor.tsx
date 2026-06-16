import { useState } from 'react'
import { get } from '@/lib/config'

interface BlinkingCursorProps {
  className?: string
}

/**
 * BlinkingCursor - Terminal-style blinking block cursor
 * Can be appended to text elements for a retro terminal aesthetic
 */
export function BlinkingCursor({ className = '' }: BlinkingCursorProps) {
  const [enabled] = useState(() => Boolean(get('CURSOR_BLINK_ENABLED')))

  if (!enabled) return null

  const blinkSpeed = get('CURSOR_BLINK_SPEED_MS')

  return (
    <span
      className={`ml-1 inline-block h-[1em] w-[0.6em] bg-primary ${className}`}
      style={{
        animation: `cursor-blink ${blinkSpeed}ms step-end infinite`,
      }}
    >
      <style>
        {`
          @keyframes cursor-blink {
            0%, 49% {
              opacity: 1;
            }
            50%, 100% {
              opacity: 0;
            }
          }
        `}
      </style>
    </span>
  )
}
