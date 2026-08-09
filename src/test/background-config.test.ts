import { describe, expect, it } from 'vitest'
import {
  parseBackgroundVideoEnabled,
  resolveActiveBackgroundVideoUrl,
} from '@/lib/background-config'

describe('parseBackgroundVideoEnabled', () => {
  it('uses explicit boolean', () => {
    expect(parseBackgroundVideoEnabled(true, false)).toBe(true)
    expect(parseBackgroundVideoEnabled(false, true)).toBe(false)
  })

  it('defaults to hasConfiguredVideo when key missing', () => {
    expect(parseBackgroundVideoEnabled(undefined, true)).toBe(true)
    expect(parseBackgroundVideoEnabled(undefined, false)).toBe(false)
  })
})

describe('resolveActiveBackgroundVideoUrl', () => {
  it('returns undefined when video master switch is off', () => {
    expect(
      resolveActiveBackgroundVideoUrl('https://x/v.mp4', undefined, 'same', false, false),
    ).toBeUndefined()
  })

  it('returns desktop url when enabled', () => {
    expect(
      resolveActiveBackgroundVideoUrl('https://x/v.mp4', undefined, 'same', false, true),
    ).toBe('https://x/v.mp4')
  })

  it('respects mobile off mode', () => {
    expect(
      resolveActiveBackgroundVideoUrl('https://x/v.mp4', 'https://x/m.mp4', 'off', true, true),
    ).toBeUndefined()
  })
})
