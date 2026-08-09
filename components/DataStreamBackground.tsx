'use client'

import { memo, useEffect, useRef } from 'react'

interface DataStreamBackgroundProps {
  opacity?: number
  perfMode?: boolean
}

type Stream = {
  x: number
  y: number
  speed: number
  chars: string[]
  head: number
}

/**
 * Horizontal / diagonal data-stream field — binary + hex glyphs with soft trails.
 * Low opacity decorative layer; DPR-capped; pauses when tab hidden.
 */
const DataStreamBackground = memo(function DataStreamBackground({
  opacity = 0.5,
  perfMode = false,
}: DataStreamBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animId = 0
    let running = true
    let streams: Stream[] = []
    const glyph = '01ABCDEF<>[]{}/\\|#@$%&*'
    const dprCap = perfMode ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
    const fontSize = perfMode ? 10 : 11
    const colW = fontSize + 2

    const resolveColor = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#00e5ff'
    let color = resolveColor()

    const rebuild = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dprCap)
      canvas.height = Math.floor(h * dprCap)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dprCap, 0, 0, dprCap, 0, 0)

      const cols = Math.ceil(w / colW)
      const count = Math.floor(cols * (perfMode ? 0.35 : 0.55))
      streams = Array.from({ length: count }, () => {
        const len = 8 + ((Math.random() * 18) | 0)
        return {
          x: (Math.random() * cols) * colW,
          y: Math.random() * h,
          speed: 40 + Math.random() * (perfMode ? 60 : 100),
          chars: Array.from({ length: len }, () => glyph[(Math.random() * glyph.length) | 0]),
          head: Math.random(),
        }
      })
    }
    rebuild()

    let resizeTimer: ReturnType<typeof setTimeout> | undefined
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(rebuild, 120)
    }
    window.addEventListener('resize', onResize, { passive: true })

    const mo = new MutationObserver(() => {
      color = resolveColor()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })

    let last = 0
    const frame = (ts: number) => {
      if (!running) return
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016
      last = ts
      const w = window.innerWidth
      const h = window.innerHeight

      // Trail fade instead of full clear — cheaper bloom feel
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(0, 0, w, h)

      ctx.font = `${fontSize}px ui-monospace, "Share Tech Mono", monospace`
      ctx.textBaseline = 'top'

      for (const s of streams) {
        s.y += s.speed * dt
        if (s.y - s.chars.length * (fontSize + 1) > h) {
          s.y = -Math.random() * 80
          s.x = ((Math.random() * (w / colW)) | 0) * colW
          if (Math.random() < 0.08) {
            for (let i = 0; i < s.chars.length; i++) {
              s.chars[i] = glyph[(Math.random() * glyph.length) | 0]
            }
          }
        }

        for (let i = 0; i < s.chars.length; i++) {
          const gy = s.y - i * (fontSize + 1)
          if (gy < -fontSize || gy > h) continue
          const isHead = i === 0
          ctx.globalAlpha = (isHead ? 0.55 : 0.12 + (1 - i / s.chars.length) * 0.28) * opacity
          ctx.fillStyle = color
          if (isHead && !perfMode) {
            ctx.shadowColor = color
            ctx.shadowBlur = 8
          } else {
            ctx.shadowBlur = 0
          }
          // occasional glyph flip
          if (!isHead && Math.random() < 0.002) {
            s.chars[i] = glyph[(Math.random() * glyph.length) | 0]
          }
          ctx.fillText(s.chars[i], s.x, gy)
        }
      }

      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(frame)
    }

    const onVis = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(animId)
      } else if (!running) {
        running = true
        last = 0
        animId = requestAnimationFrame(frame)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    animId = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(animId)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
      mo.disconnect()
    }
  }, [opacity, perfMode])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      aria-hidden
      style={{ pointerEvents: 'none', opacity }}
    />
  )
})

export default DataStreamBackground
