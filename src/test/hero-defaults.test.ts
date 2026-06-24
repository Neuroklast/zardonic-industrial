import { describe, expect, it } from 'vitest'
import { DEFAULT_HERO_LOGO_URL, resolveHeroLogoUrl } from '@/lib/hero-defaults'

describe('resolveHeroLogoUrl', () => {
  const resolve = (storage: string | null, url: string | null) => url ?? (storage ? `r2://${storage}` : null)

  it('returns configured URL when set', () => {
    expect(resolveHeroLogoUrl('hero/logo.png', 'https://cdn.example/logo.png', resolve)).toBe(
      'https://cdn.example/logo.png',
    )
  })

  it('falls back to bundled default wordmark', () => {
    expect(resolveHeroLogoUrl(null, null, resolve)).toBe(DEFAULT_HERO_LOGO_URL)
  })
})