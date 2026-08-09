'use client'

/* eslint-disable react-refresh/only-export-components */
/**
 * LenisContext — Lenis smooth-scroll provider.
 *
 * Architecture:
 *   • One Lenis instance, managed via useRef (no re-renders on scroll)
 *   • RAF loop runs in a useEffect; cancelled on unmount
 *   • Scroll-position state (scrollY, velocityY) exposed for scroll-driven effects
 *   • Falls back to native scroll when device is in "lite mode"
 *     (prefers-reduced-motion, slow connection, low-end hardware)
 *
 * Extending for new scroll effects:
 *   • Subscribe in any component with: `const { lenis } = useLenisContext()`
 *     then `lenis?.on('scroll', cb)` / `lenis?.off('scroll', cb)`
 *   • Use `scrollY` / `velocityY` from context for value-based animations
 *   • For framer-motion scroll tracking, useScroll() continues to work because
 *     Lenis fires native scroll events on the document element.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import Lenis from 'lenis'
import { usePrefersReducedMotion, isSlowConnection, isLowEndHardware } from '@/lib/device-capability'
import { resolveScrollTarget } from '@/lib/scroll-target'

// ─────────────────────────────────────────────────────────────────────────────

export interface LenisScrollToOptions {
  /** Pixels to offset from the target (negative = scroll past the target). */
  offset?: number
  /** Skip the animation and jump immediately. */
  immediate?: boolean
  /** Override the default animation duration in seconds. */
  duration?: number
}

export interface LenisContextValue {
  /** The raw Lenis instance — use for advanced subscriptions (lenis.on/off). */
  lenis: Lenis | null
  /** Programmatically scroll to an element, selector string, or pixel value. */
  scrollTo: (
    target: HTMLElement | string | number,
    options?: LenisScrollToOptions,
  ) => void
  /**
   * Snapshot scroll Y (lite mode: updates; Lenis mode: prefer `lenis.on('scroll')`
   * or `getScrollY()` so React does not re-render every wheel frame).
   */
  scrollY: number
  /** Snapshot velocity — same caveats as scrollY. */
  velocityY: number
  /** Latest scroll Y without subscribing to React state (safe in rAF / canvas loops). */
  getScrollY: () => number
  /** Latest velocity without React re-renders. */
  getVelocityY: () => number
  /** True when Lenis is disabled (lite mode) and native scroll is used. */
  isLiteMode: boolean
}

export const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  scrollTo: () => {},
  scrollY: 0,
  velocityY: 0,
  getScrollY: () => 0,
  getVelocityY: () => 0,
  isLiteMode: false,
})

// ─────────────────────────────────────────────────────────────────────────────

interface LenisProviderProps {
  children: ReactNode
  /**
   * Lenis easing — defaults to an ease-out-expo curve which feels natural for
   * most scroll interactions. Override for custom scroll feel.
   */
  easing?: (t: number) => number
  /** Scroll duration in seconds. Default: 1.2 */
  duration?: number
}

const defaultEasing = (t: number): number =>
  Math.min(1, 1.001 - Math.pow(2, -10 * t))

export function LenisProvider({
  children,
  easing = defaultEasing,
  duration = 1.2,
}: LenisProviderProps) {
  // Reactive reduced-motion preference — re-computes liteMode when the user
  // changes their OS/browser setting so Lenis is properly destroyed/created.
  const prefersReducedMotion = usePrefersReducedMotion()
  const liteMode = prefersReducedMotion || isSlowConnection() || isLowEndHardware()

  const lenisRef = useRef<Lenis | null>(null)
  const scrollYRef = useRef(0)
  const velocityYRef = useRef(0)
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null)
  /** React-visible snapshot — updated in lite mode only (not every Lenis frame). */
  const [scrollY, setScrollY] = useState(0)
  const [velocityY, setVelocityY] = useState(0)

  // Use refs for easing and duration so changing them doesn't destroy/recreate
  // Lenis mid-scroll (which would cause a visible jump).
  const easingRef = useRef(easing)
  const durationRef = useRef(duration)
  useEffect(() => { easingRef.current = easing }, [easing])
  useEffect(() => { durationRef.current = duration }, [duration])

  const getScrollY = useCallback(() => {
    const l = lenisRef.current
    if (l && typeof l.scroll === 'number') return l.scroll
    return scrollYRef.current
  }, [])

  const getVelocityY = useCallback(() => velocityYRef.current, [])

  // Main Lenis init effect only depends on liteMode so Lenis is never
  // recreated just because an easing function reference changed.
  useEffect(() => {
    if (liteMode) return

    let rafId = 0
    let lenis: Lenis | null = null

    try {
      lenis = new Lenis({
        duration: durationRef.current,
        easing: (t: number) => easingRef.current(t),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      })

      lenisRef.current = lenis
      setLenisInstance(lenis)

      // CRITICAL: update refs only — never setState on scroll.
      // setState here re-rendered SiteNav/Hero/every consumer every frame and
      // fought canvas/video background work (main-thread jank).
      lenis.on('scroll', (e: { scroll: number; velocity: number }) => {
        scrollYRef.current = e.scroll
        velocityYRef.current = e.velocity
      })

      // Drive Lenis with our own RAF loop so we control the timing
      function raf(time: number) {
        lenis?.raf(time)
        rafId = requestAnimationFrame(raf)
      }
      rafId = requestAnimationFrame(raf)
    } catch {
      // Lenis failed to initialize (e.g. SSR / jsdom) — fall back to native
      lenisRef.current = null
    }

    return () => {
      cancelAnimationFrame(rafId)
      lenis?.destroy()
      lenisRef.current = null
      setLenisInstance(null)
    }
  }, [liteMode])

  // Native scroll tracking — lite mode only. rAF-coalesce so bursty scroll
  // events do not schedule multiple React updates in one frame.
  useEffect(() => {
    if (!liteMode) return
    let raf = 0
    const flush = () => {
      raf = 0
      const y = window.scrollY || document.documentElement.scrollTop || 0
      scrollYRef.current = y
      setScrollY(y)
    }
    const handleScroll = () => {
      if (!raf) raf = requestAnimationFrame(flush)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    flush()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [liteMode])

  const scrollTo = useCallback(
    (
      target: HTMLElement | string | number,
      options?: LenisScrollToOptions,
    ) => {
      const resolved = resolveScrollTarget(target)
      const l = lenisRef.current
      if (l) {
        l.scrollTo(resolved, {
          offset: options?.offset ?? 0,
          immediate: options?.immediate ?? false,
          duration: options?.duration ?? duration,
        })
        return
      }

      // Native fallback (lite mode or Lenis not yet ready)
      const offset = options?.offset ?? 0
      if (typeof resolved === 'number') {
        window.scrollTo({ top: resolved + offset, behavior: 'smooth' })
      } else if (resolved instanceof HTMLElement) {
        const y = resolved.getBoundingClientRect().top + window.scrollY + offset
        window.scrollTo({ top: y, behavior: 'smooth' })
      } else if (typeof resolved === 'string') {
        const el = resolved.startsWith('#')
          ? document.querySelector(resolved)
          : document.getElementById(resolved)
        if (el instanceof HTMLElement) {
          const y = el.getBoundingClientRect().top + window.scrollY + offset
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }
    },
    [duration],
  )

  // Stable context identity: only changes when Lenis mounts/unmounts or liteMode flips.
  // Must NOT include per-frame scroll values as object churn.
  const value = useMemo<LenisContextValue>(
    () => ({
      lenis: lenisInstance,
      scrollTo,
      scrollY,
      velocityY,
      getScrollY,
      getVelocityY,
      isLiteMode: liteMode,
    }),
    [lenisInstance, scrollTo, scrollY, velocityY, getScrollY, getVelocityY, liteMode],
  )

  return (
    <LenisContext.Provider value={value}>
      {children}
    </LenisContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Access the Lenis context.
 *
 * @example
 * ```tsx
 * const { scrollTo, lenis, getScrollY } = useLenisContext()
 * // Scroll to a section with nav offset
 * scrollTo(element, { offset: -80 })
 * // Real-time scroll: subscribe or read refs — do NOT depend on scrollY state
 * useEffect(() => {
 *   lenis?.on('scroll', handler)
 *   return () => lenis?.off('scroll', handler)
 * }, [lenis])
 * ```
 */
export function useLenisContext(): LenisContextValue {
  return useContext(LenisContext)
}
