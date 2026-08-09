import { describe, expect, it } from 'vitest'
import {
  PUBLIC_BACKGROUND_TYPES,
  isPublicBackgroundType,
  parsePublicBackgroundType,
} from '@/lib/public-background-types'

describe('public background types', () => {
  it('includes terminal and data-stream styles', () => {
    expect(PUBLIC_BACKGROUND_TYPES).toContain('terminal')
    expect(PUBLIC_BACKGROUND_TYPES).toContain('data-stream')
    expect(PUBLIC_BACKGROUND_TYPES).toContain('matrix')
  })

  it('parses known types and falls back safely', () => {
    expect(parsePublicBackgroundType('terminal')).toBe('terminal')
    expect(parsePublicBackgroundType('nope', 'circuit')).toBe('circuit')
    expect(isPublicBackgroundType('glitch-grid')).toBe(true)
    expect(isPublicBackgroundType('video')).toBe(false)
  })
})
