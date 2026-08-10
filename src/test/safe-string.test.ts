import { describe, expect, it } from 'vitest'
import { asDisplayString } from '@/lib/safe-string'

describe('asDisplayString', () => {
  it('returns strings unchanged', () => {
    expect(asDisplayString('hello')).toBe('hello')
    expect(asDisplayString('')).toBe('')
  })

  it('coerces null and undefined to empty string', () => {
    expect(asDisplayString(null)).toBe('')
    expect(asDisplayString(undefined)).toBe('')
  })

  it('stringifies primitives that are safe to show', () => {
    expect(asDisplayString(42)).toBe('42')
    expect(asDisplayString(true)).toBe('true')
  })

  it('does not stringify objects (avoids [object Object] in UI)', () => {
    expect(asDisplayString({ content: 'x' })).toBe('')
    expect(asDisplayString(['a'])).toBe('')
  })
})
