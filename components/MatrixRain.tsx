'use client'

import React, { useEffect, useRef, memo } from 'react'
import {
  getCanvasDpr,
  isDocumentHidden,
  shouldSkipFrame,
  subscribeScrollActivity,
  targetFpsForRuntime,
} from '@/lib/canvas-perf'

/**
 * MatrixRain – cascading character rain.
 * Frame-budgeted + DPR-capped so Lenis scroll stays smooth.
 */
interface MatrixRainProps {
  transparent?: boolean
  /** Speed multiplier: 0.5 (slow) – 3 (fast). Default 1. */
  speed?: number
  /** Character spawn density: 0.3 (sparse) – 1 (dense). Default 0.7. */
  density?: number
  /** Override colour (CSS colour string). Defaults to --primary CSS variable. */
  color?: string
  perfMode?: boolean
}

const MatrixRain = memo(function MatrixRain({
  transparent,
  speed = 1,
  density = 0.7,
  color,
  perfMode = false,
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const dpr = getCanvasDpr(perfMode)
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    if (!ctx) return

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF'
    const fontSize = perfMode ? 16 : 14
    let animId = 0
    let drops: number[] = []
    let lastDraw = 0
    let isScrolling = false
    let cssW = 0
    let cssH = 0

    const resize = () => {
      cssW = window.innerWidth
      cssH = window.innerHeight
      canvas.width = Math.floor(cssW * dpr)
      canvas.height = Math.floor(cssH * dpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cols = Math.floor(cssW / fontSize)
      const colCount = perfMode ? Math.ceil(cols * 0.65) : cols
      drops = Array.from({ length: Math.max(1, colCount) }, () => Math.random() * -50)
    }

    resize()

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(resize, 150)
    })
    resizeObserver.observe(canvas)

    const getColor = () =>
      color ??
      (getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#cc3300')
    let cachedColor = getColor()

    const observer = new MutationObserver(() => {
      const newColor = getColor()
      if (newColor !== cachedColor) cachedColor = newColor
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })

    const applyColor = (ctx2d: CanvasRenderingContext2D, base: string, baseColorRatio = 0.9) => {
      const supportsColorMix =
        typeof CSS !== 'undefined' && CSS.supports('color', 'color-mix(in srgb, red 50%, blue)')
      if (supportsColorMix) {
        ctx2d.fillStyle = `color-mix(in srgb, ${base} ${Math.round(baseColorRatio * 100)}%, white)`
      } else {
        ctx2d.fillStyle = base
      }
    }

    let frameCount = 0
    const frameSkip = Math.max(1, Math.round((perfMode ? 3 : 2) / Math.max(0.5, speed)))

    const unsubScroll = subscribeScrollActivity((s) => {
      isScrolling = s
    }, 220)

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop)
      if (isDocumentHidden()) return

      const fps = targetFpsForRuntime(perfMode, isScrolling)
      if (fps <= 0 || shouldSkipFrame(lastDraw, now, fps)) return

      frameCount++
      if (frameCount % frameSkip !== 0) return
      lastDraw = now

      if (transparent) {
        ctx.clearRect(0, 0, cssW, cssH)
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
        ctx.fillRect(0, 0, cssW, cssH)
      }

      ctx.font = `${fontSize}px monospace`
      const primaryColor = cachedColor
      const step = perfMode ? 1.15 : 1

      drops.forEach((y, i) => {
        const char = chars[(Math.random() * chars.length) | 0]
        const x = i * fontSize * (perfMode ? 1.35 : 1)
        applyColor(ctx, primaryColor, 0.9)
        ctx.fillText(char, x, y * fontSize)

        const resetThreshold = 1 - density * (perfMode ? 0.018 : 0.025)
        if (Math.random() > resetThreshold) {
          drops[i] = 0
        } else {
          drops[i] += step
        }
      })
    }

    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
      observer.disconnect()
      resizeObserver.disconnect()
      clearTimeout(debounceTimerRef.current)
      unsubScroll()
    }
  }, [transparent, speed, density, color, perfMode])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-20"
      style={{ zIndex: 'var(--z-bg-animated)' } as React.CSSProperties}
      aria-hidden="true"
    />
  )
})

export default MatrixRain
