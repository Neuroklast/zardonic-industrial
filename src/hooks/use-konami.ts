import { useEffect, useState } from 'react'
import { DEFAULT_KONAMI_CODE } from '@/lib/konami'

export function useKonami() {
  const [success, setSuccess] = useState(false)
  const [, setSequence] = useState<string[]>([])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setSequence((prev) => {
        const newSeq = [...prev, e.key].slice(-10)
        if (newSeq.join(',') === DEFAULT_KONAMI_CODE.join(',')) {
          setSuccess(true)
          return []
        }
        return newSeq
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return success
}
