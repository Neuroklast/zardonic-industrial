import { describe, expect, it } from 'vitest'
import {
  resolvePublicFonts,
  buildPublicFontCssVars,
  remoteFontFamiliesToLoad,
  SYSTEM_FONT_BODY,
} from '@/lib/public-fonts'

describe('public-fonts', () => {
  it('uses system stacks when theme has no fonts', () => {
    const fonts = resolvePublicFonts({})
    expect(fonts.fontBody).toBe(SYSTEM_FONT_BODY)
    expect(fonts.fontHeading).toContain('system-ui')
  })

  it('uses admin theme fonts when set', () => {
    const fonts = resolvePublicFonts({
      fontBody: "'Inter', sans-serif",
      fontHeading: "'Rajdhani', sans-serif",
      fontMono: "'JetBrains Mono', monospace",
    })
    expect(fonts.fontBody).toBe("'Inter', sans-serif")
    expect(fonts.fontHeading).toBe("'Rajdhani', sans-serif")
    expect(remoteFontFamiliesToLoad(fonts)).toEqual(
      expect.arrayContaining(['Inter', 'Rajdhani', 'JetBrains Mono']),
    )
  })

  it('builds SSR css vars without brand hardcodes', () => {
    const css = buildPublicFontCssVars(resolvePublicFonts({ fontBody: "'Roboto', sans-serif" }))
    expect(css).toContain('--font-body:')
    expect(css).toContain('Roboto')
    expect(css).not.toContain('Orbitron')
  })
})
