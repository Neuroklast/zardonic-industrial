import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@/lib/primary-check', () => ({
  isPrimaryInstance: vi.fn(() => false),
}))

import { isPrimaryInstance } from '@/lib/primary-check'
import {
  validateActivationKey,
  clearActivationCache,
  type ActivationResult,
} from '@/lib/activation'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockIsPrimary = isPrimaryInstance as ReturnType<typeof vi.fn>

beforeEach(() => {
  sessionStorage.clear()
  mockIsPrimary.mockReturnValue(false)
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
describe('validateActivationKey()', () => {
  it('returns valid with agency tier for primary instance', async () => {
    mockIsPrimary.mockReturnValue(true)
    const result = await validateActivationKey()
    expect(result.valid).toBe(true)
    expect(result.tier).toBe('agency')
  })

  it('returns invalid when no activation key is configured', async () => {
    // import.meta.env.VITE_ACTIVATION_KEY is undefined by default in test
    const result = await validateActivationKey()
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/no activation key/i)
  })

  it('returns cached result on subsequent calls', async () => {
    const cached: ActivationResult = { valid: true, tier: 'premium', features: ['feat1'] }
    sessionStorage.setItem('zi-activation-result', JSON.stringify(cached))

    const result = await validateActivationKey()
    expect(result).toEqual(cached)
  })
})

// ---------------------------------------------------------------------------
describe('clearActivationCache()', () => {
  it('removes cached result from sessionStorage', () => {
    sessionStorage.setItem('zi-activation-result', '{"valid":true}')
    clearActivationCache()
    expect(sessionStorage.getItem('zi-activation-result')).toBeNull()
  })

  it('does not throw if sessionStorage is empty', () => {
    expect(() => clearActivationCache()).not.toThrow()
  })
})
