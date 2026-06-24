import { describe, expect, it } from 'vitest'
import { buildOgHtml, escHtml, resolveReleaseOg } from '@/lib/og-share'

describe('og-share', () => {
  it('escapes HTML in OG output', () => {
    const html = buildOgHtml(
      'https://zardonic.com',
      {
        title: '<script>alert(1)</script>',
        description: 'Test & demo',
        image: '/og-image.png',
        hash: '#releases',
      },
      'Zardonic',
    )
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('Test &amp; demo')
  })

  it('builds release metadata', () => {
    const meta = resolveReleaseOg(
      {
        id: '1',
        title: 'Album',
        type: 'album',
        description: 'Desc',
        cover_storage_path: null,
        cover_url: null,
      },
      'Zardonic',
    )
    expect(meta.title).toContain('Album')
    expect(meta.hash).toBe('#releases')
  })

  it('escHtml handles quotes', () => {
    expect(escHtml(`"quoted"`)).toBe('&quot;quoted&quot;')
  })
})