import { describe, it, expect, vi, afterEach } from 'vitest'
import { isPrimaryInstance } from '@/lib/primary-check'

// ---------------------------------------------------------------------------
describe('isPrimaryInstance()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false in jsdom test env (localhost)', () => {
    // jsdom defaults window.location.hostname to 'localhost'
    expect(isPrimaryInstance()).toBe(false)
  })

  it('returns true when hostname matches primary', () => {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      hostname: 'zardonic-industrial.vercel.app',
    })
    expect(isPrimaryInstance()).toBe(true)
  })

  it('returns true for www variant', () => {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      hostname: 'www.zardonic.industrial',
    })
    expect(isPrimaryInstance()).toBe(true)
  })

  it('returns false for unrecognised hostname', () => {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      hostname: 'evil.example.com',
    })
    expect(isPrimaryInstance()).toBe(false)
  })
})
