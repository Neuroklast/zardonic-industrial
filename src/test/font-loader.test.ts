import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  extractGoogleFontName,
  isPrivacySafeFontStack,
  loadGoogleFont,
  SELF_HOSTED_FONT_NAMES,
} from '@/lib/font-loader'

describe('font-loader (privacy-first)', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('extracts first family name from stack', () => {
    expect(extractGoogleFontName("'Orbitron', sans-serif")).toBe('Orbitron')
    expect(extractGoogleFontName('system-ui')).toBeNull()
  })

  it('treats self-hosted and system stacks as privacy-safe', () => {
    expect(isPrivacySafeFontStack("'Orbitron', sans-serif")).toBe(true)
    expect(isPrivacySafeFontStack('ui-monospace, monospace')).toBe(true)
    expect(isPrivacySafeFontStack("'Rajdhani', sans-serif")).toBe(false)
    expect(SELF_HOSTED_FONT_NAMES.has('Orbitron')).toBe(true)
  })

  it('loadGoogleFont does not inject fonts.googleapis.com links', () => {
    loadGoogleFont('Rajdhani')
    loadGoogleFont('Orbitron')
    const links = Array.from(document.querySelectorAll('link[href*="fonts.googleapis"]'))
    expect(links).toHaveLength(0)
  })
})
