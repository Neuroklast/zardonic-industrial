/**
 * Shared canvas / background performance helpers.
 * Keep animated BGs from starving Lenis smooth scroll.
 */

export type HeavyBackgroundType =
  | 'matrix'
  | 'terminal'
  | 'data-stream'
  | 'glitch-grid'
  | 'cloud-chamber'
  | 'circuit'
  | '3d-model'
  | 'stars'
  | 'minimal'
  | string

const HEAVY_BG = new Set([
  'matrix',
  'terminal',
  'data-stream',
  'glitch-grid',
  'cloud-chamber',
  'circuit',
  '3d-model',
  'cyberpunk-hud',
])

export function isHeavyBackgroundType(type: string | undefined | null): boolean {
  if (!type) return false
  return HEAVY_BG.has(type)
}

export function getCanvasDpr(perfMode: boolean, maxFull = 1.25): number {
  if (typeof window === 'undefined') return 1
  if (perfMode) return 1
  return Math.min(window.devicePixelRatio || 1, maxFull)
}

/** @returns true if this frame should be skipped (caller still rAF-loops). */
export function shouldSkipFrame(lastDrawMs: number, nowMs: number, targetFps: number): boolean {
  if (targetFps <= 0) return true
  const minDelta = 1000 / targetFps
  return nowMs - lastDrawMs < minDelta
}

export function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.hidden
}

export interface BackgroundPerfInput {
  isMobile?: boolean
  hasVideo?: boolean
  hasImage?: boolean
  backgroundType?: string | null
}

/**
 * Policy: mobile / video / image / heavy bg types → perfMode.
 * Stars/minimal stay full quality on desktop without media.
 */
export function resolveBackgroundPerfMode(input: BackgroundPerfInput): boolean {
  if (input.isMobile) return true
  if (input.hasVideo) return true
  if (input.hasImage) return true
  if (isHeavyBackgroundType(input.backgroundType ?? undefined)) return true
  return false
}

export type FrameBudgetPhase = 'hidden' | 'scrolling' | 'idle'

export function resolveTargetFps(
  phase: FrameBudgetPhase,
  perfMode: boolean,
): number {
  if (phase === 'hidden') return 0
  if (phase === 'scrolling') return perfMode ? 12 : 15
  return perfMode ? 24 : 30
}

/**
 * Subscribe to scroll activity (window scroll, passive).
 * Calls onChange(true) while scrolling; false after idleMs of quiet.
 * Returns unsubscribe.
 */
export function subscribeScrollActivity(
  onChange: (scrolling: boolean) => void,
  idleMs = 200,
): () => void {
  if (typeof window === 'undefined') return () => {}

  let idleTimer = 0
  let scrolling = false

  const setScrolling = (next: boolean) => {
    if (scrolling === next) return
    scrolling = next
    onChange(scrolling)
  }

  const onScroll = () => {
    setScrolling(true)
    window.clearTimeout(idleTimer)
    idleTimer = window.setTimeout(() => setScrolling(false), idleMs)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.clearTimeout(idleTimer)
  }
}

/** Target FPS for current document + scroll state. */
export function targetFpsForRuntime(perfMode: boolean, isScrolling: boolean): number {
  if (isDocumentHidden()) return resolveTargetFps('hidden', perfMode)
  if (isScrolling) return resolveTargetFps('scrolling', perfMode)
  return resolveTargetFps('idle', perfMode)
}
