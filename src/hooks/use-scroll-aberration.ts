import { useState, useEffect, useRef } from 'react'
import { useLenisContext } from '@/contexts/LenisContext'

export const useScrollAberration = () => {
  const [scrollY, setScrollY] = useState(0)
  const [aberrationIntensity, setAberrationIntensity] = useState(0)
  const { lenis, isLiteMode } = useLenisContext()

  // Use a ref to track intensity so the decay RAF loop avoids setState-in-updater side effects
  const intensityRef = useRef(0)

  useEffect(() => {
    let rafId: number
    let decayRafId: number

    const setIntensity = (val: number) => {
      intensityRef.current = val
      setAberrationIntensity(val)
    }

    const startDecay = () => {
      cancelAnimationFrame(decayRafId)
      const decay = () => {
        const prev = intensityRef.current
        if (prev < 0.001) {
          setIntensity(0)
          return
        }
        const next = prev * 0.9
        setIntensity(next)
        decayRafId = requestAnimationFrame(decay)
      }
      decayRafId = requestAnimationFrame(decay)
    }

    if (!isLiteMode && lenis) {
      // Lenis mode: subscribe to Lenis scroll events
      let lastLenisY = 0
      const handleLenisScroll = (e: { scroll: number; velocity: number }) => {
        const scrollDelta = Math.abs(e.scroll - lastLenisY)
        const intensity = Math.min(scrollDelta / 100, 1)
        lastLenisY = e.scroll

        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          setScrollY(e.scroll)
          if (intensity > 0) {
            setIntensity(intensity)
            startDecay()
          }
        })
      }

      lenis.on('scroll', handleLenisScroll)

      return () => {
        lenis.off('scroll', handleLenisScroll)
        cancelAnimationFrame(rafId)
        cancelAnimationFrame(decayRafId)
      }
    }

    // Lite mode / no Lenis: fall back to native scroll event
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = Math.abs(currentScrollY - lastScrollY)
      const intensity = Math.min(scrollDelta / 100, 1)

      lastScrollY = currentScrollY

      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setScrollY(currentScrollY)
        if (intensity > 0) {
          setIntensity(intensity)
          startDecay()
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
      cancelAnimationFrame(decayRafId)
    }
  }, [lenis, isLiteMode])

  return { scrollY, aberrationIntensity }
}