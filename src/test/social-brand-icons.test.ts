import { describe, expect, it } from 'vitest'
import { resolveBrandMark } from '@/lib/social-brand-icons'

describe('footer brand icon selection', () => {
  it.each(['Apple Music', 'Amazon Music', 'Beatport', 'Tidal', 'Deezer', 'Spotify', 'YouTube', 'SoundCloud', 'TikTok'])(
    'provides a monochrome vector logo for %s',
    (platform) => {
      const mark = resolveBrandMark(platform)
      expect(mark?.path.length).toBeGreaterThan(15)
      expect(mark?.viewBox).toBeTruthy()
    },
  )
  it('does not confuse unrelated platform names with established brands', () => {
    expect(resolveBrandMark('Unknown platform')).toBeNull()
  })
})
