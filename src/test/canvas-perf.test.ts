import { describe, expect, it } from 'vitest'
import {
  getCanvasDpr,
  isHeavyBackgroundType,
  resolveBackgroundPerfMode,
  resolveTargetFps,
  shouldSkipFrame,
} from '@/lib/canvas-perf'

describe('canvas-perf', () => {
  it('classifies heavy background types', () => {
    expect(isHeavyBackgroundType('matrix')).toBe(true)
    expect(isHeavyBackgroundType('glitch-grid')).toBe(true)
    expect(isHeavyBackgroundType('stars')).toBe(false)
    expect(isHeavyBackgroundType('minimal')).toBe(false)
  })

  it('resolves perfMode policy', () => {
    expect(resolveBackgroundPerfMode({ isMobile: true })).toBe(true)
    expect(resolveBackgroundPerfMode({ hasVideo: true })).toBe(true)
    expect(resolveBackgroundPerfMode({ backgroundType: 'matrix' })).toBe(true)
    expect(resolveBackgroundPerfMode({ backgroundType: 'stars', isMobile: false })).toBe(false)
  })

  it('skips frames under target fps', () => {
    expect(shouldSkipFrame(0, 10, 30)).toBe(true)
    expect(shouldSkipFrame(0, 40, 30)).toBe(false)
  })

  it('target fps by phase', () => {
    expect(resolveTargetFps('hidden', true)).toBe(0)
    expect(resolveTargetFps('scrolling', true)).toBe(12)
    expect(resolveTargetFps('idle', false)).toBe(30)
  })

  it('dpr caps in perfMode', () => {
    expect(getCanvasDpr(true)).toBe(1)
  })
})
