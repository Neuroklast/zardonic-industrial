import { useEffect, useRef, memo } from 'react'

interface Star {
  x: number
  y: number
  z: number
  pz: number
}

/**
 * StarField – Canvas-based warp-speed star field.
 * Stars fly towards the viewer giving a hyperspace feel.
 * Respects `prefers-reduced-motion` and pauses when the tab is hidden.
 */
interface StarFieldProps {
  transparent?: boolean
  /** Number of stars (50–500). Default 200. */
  starCount?: number
  /** Speed multiplier (0.5–3). Default 1. */
  starSpeed?: number
}

const StarField = memo(function StarField({ transparent, starCount = 200, starSpeed = 1 }: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const NUM_STARS = Math.max(50, Math.min(500, starCount))
    let animId: number
    let stars: Star[] = []
    let cx = 0
    let cy = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      cx = canvas.width / 2
      cy = canvas.height / 2
    }

    const initStars = () => {
      stars = Array.from({ length: NUM_STARS }, () => ({
        x: (Math.random() - 0.5) * canvas.width,
        y: (Math.random() - 0.5) * canvas.height,
        z: Math.random() * canvas.width,
        pz: 0,
      }))
      stars.forEach(s => { s.pz = s.z })
    }

    resize()
    initStars()
    const handleResize = () => { resize(); initStars() }
    window.addEventListener('resize', handleResize)

    const baseSpeed = 6 * starSpeed

    let running = true
    const draw = () => {
      if (!running || document.hidden) {
        animId = requestAnimationFrame(draw)
        return
      }

      // Clear or fade: in transparent (overlay) mode clear the canvas so the
      // background image shows through; otherwise use a semi-transparent fill
      // to create the motion-blur trail effect.
      if (transparent) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.15)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary')
        .trim() || 'oklch(0.50 0.22 25)'

      stars.forEach(star => {
        star.pz = star.z
        star.z -= baseSpeed

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas.width
          star.y = (Math.random() - 0.5) * canvas.height
          star.z = canvas.width
          star.pz = star.z
        }

        const sx = (star.x / star.z) * canvas.width + cx
        const sy = (star.y / star.z) * canvas.height + cy
        const px = (star.x / star.pz) * canvas.width + cx
        const py = (star.y / star.pz) * canvas.height + cy

        const size = Math.max(0.5, (1 - star.z / canvas.width) * 3)

        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(sx, sy)
        ctx.strokeStyle = `color-mix(in srgb, ${primaryColor} 60%, white)`
        ctx.lineWidth = size
        ctx.globalAlpha = (1 - star.z / canvas.width) * 0.8
        ctx.stroke()
        ctx.globalAlpha = 1
      })

      animId = requestAnimationFrame(draw)
    }

    const handleVisibility = () => { running = !document.hidden }
    document.addEventListener('visibilitychange', handleVisibility)

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [transparent, starCount, starSpeed])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-30"
      aria-hidden="true"
    />
  )
})

export default StarField
