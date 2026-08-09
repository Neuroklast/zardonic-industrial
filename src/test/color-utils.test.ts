import { describe, it, expect } from 'vitest'
import { hexToOklch, oklchToHex, parseHexColor } from '@/lib/color-utils'

function hexDistance(a: string, b: string): number {
  const pa = parseHexColor(a)
  const pb = parseHexColor(b)
  if (!pa || !pb) return 999
  return Math.max(Math.abs(pa.r - pb.r), Math.abs(pa.g - pb.g), Math.abs(pa.b - pb.b))
}

describe('color-utils hex ↔ oklch roundtrip', () => {
  it.each([
    '#6399a6',
    '#008885',
    '#000000',
    '#ffffff',
    '#dc2626',
    '#33b8cc',
  ])('round-trips %s within ±2 RGB', (hex) => {
    const oklch = hexToOklch(hex)
    expect(oklch.startsWith('oklch(')).toBe(true)
    const back = oklchToHex(oklch)
    expect(hexDistance(hex, back)).toBeLessThanOrEqual(2)
  })

  it('parseHexColor accepts short and long forms', () => {
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseHexColor('#6399A6')).toEqual({ r: 99, g: 153, b: 166 })
  })
})
