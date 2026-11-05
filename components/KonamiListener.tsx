'use client'

import { useEffect } from 'react'
import { DEFAULT_KONAMI_CODE } from '@/lib/konami'

interface KonamiListenerProps {
  onCodeActivated?: () => void
  /** Custom key sequence. Falls back to the classic Konami code when omitted. */
  customCode?: string[]
}

export default function KonamiListener({ onCodeActivated, customCode }: KonamiListenerProps) {
  const code = Array.isArray(customCode) && customCode.length > 0 && customCode.every((key) => typeof key === 'string' && key.length > 0)
    ? customCode : DEFAULT_KONAMI_CODE

  useEffect(() => {
    let konamiIndex = 0

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = typeof e.key === 'string' ? e.key.toLowerCase() : ''
      const expected = code[konamiIndex]
      if (typeof expected !== 'string') {
        konamiIndex = 0
        return
      }
      const expectedKey = expected.toLowerCase()

      if (key === expectedKey) {
        konamiIndex++
        
        if (konamiIndex === code.length) {
          konamiIndex = 0
          onCodeActivated?.()
        }
      } else {
        konamiIndex = 0
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCodeActivated, code])

  return null
}
