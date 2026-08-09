import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  extractGoogleFontName,
  isPrivacySafeFontStack,
  loadGoogleFont,
  SELF_HOSTED_FONT_NAMES,
} from '@/lib/font-loader'

describe('font-loader', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('extracts first family name from stack', () => {
    expect(extractGoogleFontName("'Orbitron', sans-serif")).toBe('Orbitron')
    expect(extractGoogleFontName('system-ui')).toBeNull()
    expect(extractGoogleFontName("var(--font-orbitron), 'Orbitron', sans-serif")).toBe('Orbitron')
  })

  it('treats self-hosted and system stacks as privacy-safe', () => {
    expect(isPrivacySafeFontStack("'Orbitron', sans-serif")).toBe(true)
    expect(isPrivacySafeFontStack('ui-monospace, monospace')).toBe(true)
    expect(isPrivacySafeFontStack("'Rajdhani', sans-serif")).toBe(false)
    expect(SELF_HOSTED_FONT_NAMES.has('Orbitron')).toBe(true)
  })

  it('does not inject Google CSS for self-hosted names', () => {
    loadGoogleFont('Orbitron')
    loadGoogleFont('Space Mono')
    expect(document.querySelectorAll('link[href*="fonts.googleapis"]')).toHaveLength(0)
  })

  it('injects Google CSS once for admin-selected remote fonts (e.g. Inter for bio body)', () => {
    loadGoogleFont('Inter')
    loadGoogleFont('Inter')
    const links = document.querySelectorAll('link[href*="fonts.googleapis"][href*="Inter"]')
    expect(links.length).toBe(1)
  })
})
