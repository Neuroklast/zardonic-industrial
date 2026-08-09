'use client'

import { useEffect, useRef, memo } from 'react'
import {
  getCanvasDpr,
  isDocumentHidden,
  shouldSkipFrame,
  subscribeScrollActivity,
  targetFpsForRuntime,
} from '@/lib/canvas-perf'

/**
 * GlitchGridBackground — digicide-style grid/scan without main-thread thrash.
 *
 * Perf rules (Lenis-friendly):
 * - Static grid cached on offscreen canvas (redraw only on resize)
 * - NO getImageData/putImageData (GPU readback was killing scroll)
 * - DPR capped; shared frame budget + scroll throttle
 * - Pauses when tab hidden
 */

type Strip = { y: number; h: number; dx: number; life: number; maxLife: number }

const GlitchGridBackground = memo(function GlitchGridBackground({
  transparent,
  gridSize: gridSizeProp,
  scanSpeed: scanSpeedProp,
  glitchFrequency: glitchFrequencyProp,
  perfMode = false,
}: {
  transparent?: boolean
  gridSize?: number
  scanSpeed?: number
  glitchFrequency?: number
  /** Lower resolution + fewer FX while scrolling stays smooth. */
  perfMode?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (typeof window === 'undefined') return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    if (!ctx) return

    const dprCap = getCanvasDpr(perfMode, 1.25)
    const gridSize = gridSizeProp ?? (perfMode ? 36 : 28)
    const scanSpeed = scanSpeedProp ?? 1
    const glitchFreq = glitchFrequencyProp ?? (perfMode ? 0.18 : 0.35)

    let animFrame = 0
    let running = true
    let tick = 0
    let lastDraw = 0
    let isScrolling = false
    let cssW = 0
    let cssH = 0

    /** Cached static layer: grid + diagonals + arcs (expensive, rare redraw). */
    let staticLayer: HTMLCanvasElement | null = null

    const strips: Strip[] = []

    function paintStatic(w: number, h: number) {
      // CSS-pixel sized cache — drawn with the main context's DPR transform
      const off = document.createElement('canvas')
      off.width = Math.max(1, w)
      off.height = Math.max(1, h)
      const octx = off.getContext('2d')
      if (!octx) return null

      if (!transparent) {
        octx.fillStyle = 'rgb(4, 4, 6)'
        octx.fillRect(0, 0, w, h)
      }

      octx.strokeStyle = 'rgba(160, 170, 200, 0.045)'
      octx.lineWidth = 0.5
      for (let x = 0; x < w; x += gridSize) {
        octx.beginPath()
        octx.moveTo(x + 0.5, 0)
        octx.lineTo(x + 0.5, h)
        octx.stroke()
      }
      for (let y = 0; y < h; y += gridSize) {
        octx.beginPath()
        octx.moveTo(0, y + 0.5)
        octx.lineTo(w, y + 0.5)
        octx.stroke()
      }

      if (!perfMode) {
        octx.strokeStyle = 'rgba(160, 170, 200, 0.018)'
        const diagSpacing = 64
        for (let d = -h; d < w + h; d += diagSpacing) {
          octx.beginPath()
          octx.moveTo(d, 0)
          octx.lineTo(d + h, h)
          octx.stroke()
        }

        octx.strokeStyle = 'rgba(140, 160, 200, 0.06)'
        octx.lineWidth = 0.6
        const cx = w * 0.08
        const cy = h * 0.82
        const maxR = Math.max(w, h) * 0.9
        for (let r = 60; r < maxR; r += 90) {
          octx.beginPath()
          octx.arc(cx, cy, r, 0, Math.PI * 2)
          octx.stroke()
        }
      }

      const vig = octx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.95)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,4,0.55)')
      octx.fillStyle = vig
      octx.fillRect(0, 0, w, h)

      return off
    }

    function resize() {
      cssW = window.innerWidth
      cssH = window.innerHeight
      canvas!.width = Math.max(1, Math.floor(cssW * dprCap))
      canvas!.height = Math.max(1, Math.floor(cssH * dprCap))
      canvas!.style.width = `${cssW}px`
      canvas!.style.height = `${cssH}px`
      ctx!.setTransform(dprCap, 0, 0, dprCap, 0, 0)
      staticLayer = paintStatic(cssW, cssH)
    }

    function spawnStrip() {
      const h = 1 + ((Math.random() * (perfMode ? 3 : 4)) | 0)
      strips.push({
        y: (Math.random() * cssH) | 0,
        h,
        dx: (Math.random() - 0.5) * (perfMode ? 24 : 36),
        life: 0,
        maxLife: 3 + ((Math.random() * 8) | 0),
      })
    }

    const unsubScroll = subscribeScrollActivity((s) => {
      isScrolling = s
    }, 220)

    function draw(now: number) {
      if (!running || !ctx || !canvas) return

      if (!prefersReduced) {
        animFrame = requestAnimationFrame(draw)
      }

      if (isDocumentHidden()) return
      // Prefer shared budget; glitch is always expensive so floor FPS a bit lower
      const fps = Math.min(targetFpsForRuntime(perfMode, isScrolling), perfMode ? 24 : 30)
      if (fps <= 0 || shouldSkipFrame(lastDraw, now, fps)) return
      lastDraw = now
      tick++

      const W = cssW
      const H = cssH

      if (transparent) {
        ctx.clearRect(0, 0, W, H)
      }

      if (staticLayer) {
        ctx.drawImage(staticLayer, 0, 0, W, H)
      } else if (!transparent) {
        ctx.fillStyle = 'rgb(4, 4, 6)'
        ctx.fillRect(0, 0, W, H)
      }

      // Scan beam (cheap gradient)
      const scanX = ((tick * 0.45 * scanSpeed) % (W + 80)) - 40
      const scanGrad = ctx.createLinearGradient(scanX - 28, 0, scanX + 28, 0)
      scanGrad.addColorStop(0, 'rgba(180,200,255,0)')
      scanGrad.addColorStop(0.5, 'rgba(180,200,255,0.035)')
      scanGrad.addColorStop(1, 'rgba(180,200,255,0)')
      ctx.fillStyle = scanGrad
      ctx.fillRect(scanX - 28, 0, 56, H)

      // Glitch strips: solid chromatic bars only (no getImageData)
      if (tick % (perfMode ? 12 : 8) === 0 && Math.random() < glitchFreq) {
        spawnStrip()
        if (strips.length > (perfMode ? 4 : 8)) strips.shift()
      }

      for (let i = strips.length - 1; i >= 0; i--) {
        const s = strips[i]
        s.life++
        const progress = s.life / s.maxLife
        const alpha = Math.sin(progress * Math.PI) * 0.55
        const y = Math.max(0, Math.min(H - s.h, s.y))

        ctx.fillStyle = `rgba(255, 40, 80, ${alpha * 0.35})`
        ctx.fillRect(s.dx, y, W, s.h)
        ctx.fillStyle = `rgba(40, 200, 255, ${alpha * 0.3})`
        ctx.fillRect(-s.dx, y, W, s.h)
        ctx.fillStyle = `rgba(220, 230, 255, ${alpha * 0.12})`
        ctx.fillRect(0, y, W, 1)

        if (s.life >= s.maxLife) strips.splice(i, 1)
      }

      // Sparse pixel dust (few draws — not full-height CRT loops)
      const dust = perfMode ? 18 : 36
      for (let i = 0; i < dust; i++) {
        const px = (Math.random() * W) | 0
        const py = (Math.random() * H) | 0
        const bri = 120 + ((Math.random() * 100) | 0)
        ctx.fillStyle = `rgba(${bri},${bri + 15},${bri + 25},${Math.random() * 0.35})`
        ctx.fillRect(px, py, 1, 1)
      }
    }

    resize()
    const onResize = () => {
      resize()
    }
    window.addEventListener('resize', onResize)

    if (prefersReduced) {
      draw(performance.now())
    } else {
      animFrame = requestAnimationFrame(draw)
    }

    return () => {
      running = false
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', onResize)
      unsubScroll()
      staticLayer = null
    }
  }, [transparent, gridSizeProp, scanSpeedProp, glitchFrequencyProp, perfMode])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity: 1 }}
      aria-hidden="true"
    />
  )
})

export default GlitchGridBackground
