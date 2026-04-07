import { useEffect, useState } from 'react'

const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]

export function useKonami() {
  const [success, setSuccess] = useState(false)
  const [, setSequence] = useState<string[]>([])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setSequence((prev) => {
        const newSeq = [...prev, e.key].slice(-10)
        if (newSeq.join(',') === KONAMI_CODE.join(',')) {
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
