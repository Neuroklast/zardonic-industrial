'use client'

import { memo, useEffect, useRef } from 'react'
import {
  getCanvasDpr,
  isDocumentHidden,
  shouldSkipFrame,
  subscribeScrollActivity,
  targetFpsForRuntime,
} from '@/lib/canvas-perf'

interface TerminalBackgroundProps {
  /** Overall opacity of the effect layer (0–1). Default 0.55. */
  opacity?: number
  /** Lower density for image+video stacks. */
  perfMode?: boolean
}

const BOOT_LINES = [
  '> BOOT SEQUENCE INIT…',
  '> KERNEL  v4.2.0-zrd  [OK]',
  '> MOUNT /dev/neural0  [OK]',
  '> CRYPTO HANDSHAKE…  AES-256',
  '> LINK ESTABLISHED  0x7F3A',
  '> STREAM BUFFER  4096k',
  '> AUTH: ********  GRANTED',
  '> LOADING MODULES…',
  '  · scanline_fx.ko',
  '  · chroma_split.ko',
  '  · overlay_shell.ko',
  '> SYS.READY  // ZARDONIC.NET',
]

const LIVE_SNIPPETS = [
  'pkt recv 0xA4F1  len=64  ttl=42',
  'mem map 0x7FFE0000–0x7FFFFFFF',
  'irq 11  handled  latency=0.12ms',
  'fsync /var/log/access  ok',
  'dns resolve zardonic.net → edge',
  'cache hit ratio 0.94  (cdn)',
  'gpu blit 1920x1080  ~16.6ms',
  'entropy pool 4096 bits',
  'watchdog  ping  ok',
  'worker[3]  job=overlay  done',
  'tls 1.3  cipher=CHACHA20',
  'queue depth 3 / 128',
]

/**
 * Terminal shell background — multi-pane phosphor terminal with boot log,
 * live scrolling lines, hex ticker, and soft CRT bloom.
 * Canvas only, pointer-events none, pauses on hidden tab / reduced motion.
 */
const TerminalBackground = memo(function TerminalBackground({
  opacity = 0.55,
  perfMode = false,
}: TerminalBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animId = 0
    let running = true
    let lastTs = 0
    let lastDraw = 0
    let isScrolling = false
    let bootIndex = 0
    let bootTimer = 0
    const liveLines: string[] = []
    let liveTimer = 0
    let hexOffset = 0
    let cursorBlink = 0

    const dprCap = getCanvasDpr(perfMode, 1.25)
    const fontSize = perfMode ? 11 : 12
    const lineH = fontSize + 4
    const maxLive = perfMode ? 14 : 22

    const resolveColor = () => {
      const primary =
        getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() ||
        '#33ff66'
      return primary
    }
    let color = resolveColor()

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dprCap)
      canvas.height = Math.floor(h * dprCap)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dprCap, 0, 0, dprCap, 0, 0)
    }
    resize()

    const onResize = () => resize()
    window.addEventListener('resize', onResize, { passive: true })

    const mo = new MutationObserver(() => {
      color = resolveColor()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })

    const hexChars = '0123456789ABCDEF'
    const randomHexLine = (len: number) => {
      let s = ''
      for (let i = 0; i < len; i++) s += hexChars[(Math.random() * 16) | 0]
      return s
    }

    const unsubScroll = subscribeScrollActivity((s) => {
      isScrolling = s
    }, 220)

    const drawFrame = (ts: number) => {
      if (!running) return
      animId = requestAnimationFrame(drawFrame)

      if (isDocumentHidden()) return
      const fps = targetFpsForRuntime(perfMode, isScrolling)
      if (fps <= 0 || shouldSkipFrame(lastDraw, ts, fps)) return
      lastDraw = ts

      const dt = lastTs ? Math.min(48, ts - lastTs) : 16
      lastTs = ts

      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      // Soft vignette so text stays readable in content area
      const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.15, w / 2, h / 2, h * 0.75)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(0,0,0,0.35)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      ctx.font = `${fontSize}px ui-monospace, "Share Tech Mono", monospace`
      ctx.textBaseline = 'top'

      // Left boot pane
      const leftX = 16
      let y = 16
      bootTimer += dt
      if (bootTimer > 90 && bootIndex < BOOT_LINES.length) {
        bootIndex++
        bootTimer = 0
      }
      for (let i = 0; i < bootIndex; i++) {
        const line = BOOT_LINES[i]
        const fade = i === bootIndex - 1 ? Math.min(1, bootTimer / 90) : 1
        ctx.globalAlpha = 0.35 * fade * opacity
        ctx.fillStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = perfMode ? 0 : 6
        ctx.fillText(line, leftX, y)
        y += lineH
      }
      cursorBlink += dt
      if (bootIndex >= BOOT_LINES.length && (cursorBlink / 500) % 2 < 1) {
        ctx.globalAlpha = 0.5 * opacity
        ctx.fillText('█', leftX, y)
      }

      // Right live log pane
      liveTimer += dt
      if (liveTimer > (perfMode ? 280 : 180)) {
        liveTimer = 0
        liveLines.push(
          LIVE_SNIPPETS[(Math.random() * LIVE_SNIPPETS.length) | 0] +
            '  ' +
            randomHexLine(6),
        )
        if (liveLines.length > maxLive) liveLines.shift()
      }
      const rightX = Math.max(w * 0.55, w - 420)
      let ry = 16
      ctx.shadowBlur = 0
      for (let i = 0; i < liveLines.length; i++) {
        const age = i / Math.max(1, liveLines.length - 1)
        ctx.globalAlpha = (0.15 + age * 0.35) * opacity
        ctx.fillStyle = color
        ctx.fillText(liveLines[i], rightX, ry)
        ry += lineH
      }

      // Bottom hex ticker
      hexOffset = (hexOffset + dt * 0.04) % 24
      ctx.globalAlpha = 0.22 * opacity
      ctx.fillStyle = color
      const tickerY = h - 28
      let tx = -hexOffset
      while (tx < w + 40) {
        ctx.fillText(randomHexLine(8), tx, tickerY)
        tx += 72
      }

      // Scanline sweep (cheap)
      if (!perfMode) {
        const sweepY = ((ts * 0.04) % (h + 80)) - 40
        const g = ctx.createLinearGradient(0, sweepY, 0, sweepY + 48)
        g.addColorStop(0, 'rgba(0,0,0,0)')
        g.addColorStop(0.5, color.startsWith('oklch') ? 'rgba(255,255,255,0.04)' : 'rgba(80,255,120,0.05)')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = opacity
        ctx.fillStyle = g
        ctx.fillRect(0, sweepY, w, 48)
      }

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    }

    animId = requestAnimationFrame(drawFrame)

    return () => {
      running = false
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      unsubScroll()
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

export default TerminalBackground
