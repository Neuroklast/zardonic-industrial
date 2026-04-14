import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  prefersReducedMotion,
  isSlowConnection,
  isLowEndHardware,
  shouldUseLiteMode,
} from '@/lib/device-capability'

// Helper to set up window.matchMedia mock
function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduce') ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// Helper to override navigator properties
function setNavigator(overrides: Record<string, unknown>) {
  Object.defineProperty(window, 'navigator', {
    writable: true,
    value: { ...window.navigator, ...overrides },
  })
}

describe('prefersReducedMotion()', () => {
  it('returns false when matchMedia does not match', () => {
    mockMatchMedia(false)
    expect(prefersReducedMotion()).toBe(false)
  })

  it('returns true when matchMedia matches prefers-reduced-motion', () => {
    mockMatchMedia(true)
    expect(prefersReducedMotion()).toBe(true)
  })
})

describe('isSlowConnection()', () => {
  beforeEach(() => {
    // Reset navigator to a plain object without connection
    setNavigator({ connection: undefined })
  })

  it('returns false when navigator.connection is undefined', () => {
    expect(isSlowConnection()).toBe(false)
  })

  it('returns true when saveData is true', () => {
    setNavigator({ connection: { saveData: true } })
    expect(isSlowConnection()).toBe(true)
  })

  it('returns true when effectiveType is "2g"', () => {
    setNavigator({ connection: { effectiveType: '2g', saveData: false } })
    expect(isSlowConnection()).toBe(true)
  })

  it('returns true when effectiveType is "slow-2g"', () => {
    setNavigator({ connection: { effectiveType: 'slow-2g', saveData: false } })
    expect(isSlowConnection()).toBe(true)
  })

  it('returns false when effectiveType is "4g"', () => {
    setNavigator({ connection: { effectiveType: '4g', saveData: false } })
    expect(isSlowConnection()).toBe(false)
  })
})

describe('isLowEndHardware()', () => {
  it('returns true when hardwareConcurrency is 2', () => {
    setNavigator({ hardwareConcurrency: 2, deviceMemory: undefined })
    expect(isLowEndHardware()).toBe(true)
  })

  it('returns true when hardwareConcurrency is 1', () => {
    setNavigator({ hardwareConcurrency: 1, deviceMemory: undefined })
    expect(isLowEndHardware()).toBe(true)
  })

  it('returns false when hardwareConcurrency is 4', () => {
    setNavigator({ hardwareConcurrency: 4, deviceMemory: undefined })
    expect(isLowEndHardware()).toBe(false)
  })

  it('returns true when deviceMemory is 1', () => {
    setNavigator({ hardwareConcurrency: 8, deviceMemory: 1 })
    expect(isLowEndHardware()).toBe(true)
  })

  it('returns false when deviceMemory is 4', () => {
    setNavigator({ hardwareConcurrency: 8, deviceMemory: 4 })
    expect(isLowEndHardware()).toBe(false)
  })
})

describe('shouldUseLiteMode()', () => {
  beforeEach(() => {
    mockMatchMedia(false)
    setNavigator({ hardwareConcurrency: 8, connection: { saveData: false, effectiveType: '4g' }, deviceMemory: 8 })
  })

  it('returns false for a high-end device without reduced-motion', () => {
    expect(shouldUseLiteMode()).toBe(false)
  })

  it('returns true when reduced-motion is preferred', () => {
    mockMatchMedia(true)
    expect(shouldUseLiteMode()).toBe(true)
  })

  it('returns true when connection is slow', () => {
    setNavigator({ hardwareConcurrency: 8, connection: { saveData: false, effectiveType: '2g' }, deviceMemory: 8 })
    expect(shouldUseLiteMode()).toBe(true)
  })

  it('returns true when hardware is low-end', () => {
    setNavigator({ hardwareConcurrency: 2, connection: { saveData: false, effectiveType: '4g' }, deviceMemory: 8 })
    expect(shouldUseLiteMode()).toBe(true)
  })
})
