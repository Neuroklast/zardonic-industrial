import { describe, it, expect } from 'vitest'
import { toDirectImageUrl } from '@/lib/image-cache'

describe('toDirectImageUrl', () => {
  it('converts Google Drive /file/d/ URLs to wsrv.nl proxy URLs', () => {
    const url = 'https://drive.google.com/file/d/1aBcDeFgHiJkLmN/view?usp=sharing'
    expect(toDirectImageUrl(url)).toBe(
      'https://wsrv.nl/?url=https://lh3.googleusercontent.com/d/1aBcDeFgHiJkLmN&q=80&output=webp'
    )
  })

  it('converts Google Drive /file/d/ URLs without query params', () => {
    const url = 'https://drive.google.com/file/d/abc123/view'
    expect(toDirectImageUrl(url)).toBe(
      'https://wsrv.nl/?url=https://lh3.googleusercontent.com/d/abc123&q=80&output=webp'
    )
  })

  it('converts Google Drive open?id= URLs', () => {
    const url = 'https://drive.google.com/open?id=xyz789'
    expect(toDirectImageUrl(url)).toBe(
      'https://wsrv.nl/?url=https://lh3.googleusercontent.com/d/xyz789&q=80&output=webp'
    )
  })

  it('converts Google Drive open?id= with extra params', () => {
    const url = 'https://drive.google.com/open?id=xyz789&other=1'
    expect(toDirectImageUrl(url)).toBe(
      'https://wsrv.nl/?url=https://lh3.googleusercontent.com/d/xyz789&q=80&output=webp'
    )
  })

  it('converts Google Drive uc?export=view URLs', () => {
    const url = 'https://drive.google.com/uc?export=view&id=abc123'
    expect(toDirectImageUrl(url)).toBe(
      'https://wsrv.nl/?url=https://lh3.googleusercontent.com/d/abc123&q=80&output=webp'
    )
  })

  it('converts Google Drive /file/d/ URLs with usp=drive_link', () => {
    const url = 'https://drive.google.com/file/d/1T9UYw6j0W5TzNi0gZLOLgbH_5HXhBueD/view?usp=drive_link'
    expect(toDirectImageUrl(url)).toBe(
      'https://wsrv.nl/?url=https://lh3.googleusercontent.com/d/1T9UYw6j0W5TzNi0gZLOLgbH_5HXhBueD&q=80&output=webp'
    )
  })

  it('wraps bare lh3.googleusercontent.com URLs through wsrv.nl', () => {
    const url = 'https://lh3.googleusercontent.com/d/1aBcDeFgHiJkLmN'
    expect(toDirectImageUrl(url)).toBe(
      'https://wsrv.nl/?url=https://lh3.googleusercontent.com/d/1aBcDeFgHiJkLmN&q=80&output=webp'
    )
  })

  it('wraps regular external http/https URLs through wsrv.nl', () => {
    const url = 'https://example.com/images/photo.jpg'
    expect(toDirectImageUrl(url)).toBe(
      `https://wsrv.nl/?url=${encodeURIComponent(url)}&q=80&output=webp`
    )
  })

  it('wraps http URLs through wsrv.nl', () => {
    const url = 'http://example.com/images/photo.jpg'
    expect(toDirectImageUrl(url)).toBe(
      `https://wsrv.nl/?url=${encodeURIComponent(url)}&q=80&output=webp`
    )
  })

  it('wraps CORS-blocked CDN URLs through wsrv.nl', () => {
    const url = 'https://cdn2.steamgriddb.com/logo/7fdd8d8997a41afbdd8381c287d9a984.png'
    expect(toDirectImageUrl(url)).toBe(
      `https://wsrv.nl/?url=${encodeURIComponent(url)}&q=80&output=webp`
    )
  })

  it('passes through data URLs unchanged', () => {
    const url = 'data:image/jpeg;base64,/9j/4AAQ...'
    expect(toDirectImageUrl(url)).toBe(url)
  })

  it('passes through relative URLs unchanged', () => {
    const url = '/assets/images/photo.png'
    expect(toDirectImageUrl(url)).toBe(url)
  })

  it('does not double-wrap already-wsrv.nl URLs', () => {
    const url = 'https://wsrv.nl/?url=https%3A%2F%2Fexample.com%2Fphoto.jpg'
    expect(toDirectImageUrl(url)).toBe(url + '&q=80&output=webp')
  })

  it('unwraps wsrv wrappers of R2 instead of keeping the stale proxy', () => {
    const inner = 'https://pub-0f758eac6e4d4b2dbbaedd819e15f764.r2.dev/partners/logos/x.png'
    const wrapped = `https://wsrv.nl/?url=${encodeURIComponent(inner)}&output=png&n=-1&w=1024`
    const direct = toDirectImageUrl(wrapped)
    expect(direct).not.toContain('wsrv.nl')
    expect(direct).toContain('.r2.dev/partners/logos/x.png')
  })

  it('serves R2 and Bandcamp URLs directly without wsrv.nl', () => {
    const r2 = 'https://pub-c862cb6925c84a63a9bf41ce3bf1d671.r2.dev/cover-art/test.jpeg'
    const bandcamp = 'https://f4.bcbits.com/img/a2732111435_1x1_700.avif'
    expect(toDirectImageUrl(r2)).toBe(r2)
    expect(toDirectImageUrl(bandcamp)).toBe(bandcamp)
  })

  it('serves Apple Music and YouTube thumbnail hosts directly', () => {
    const mz = 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/cover.jpg'
    const yt = 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
    expect(toDirectImageUrl(mz)).toBe(mz)
    expect(toDirectImageUrl(yt)).toBe(yt)
  })

  it('routes legacy Supabase Storage URLs through wsrv.nl (egress guard)', () => {
    // .supabase.co must NOT be treated as a trusted direct host anymore:
    // direct browser fetches would move egress onto Supabase.
    const supabase = 'https://xyzabc.supabase.co/storage/v1/object/public/images/pic.png'
    expect(toDirectImageUrl(supabase)).toBe(
      `https://wsrv.nl/?url=${encodeURIComponent(supabase)}&q=80&output=webp`,
    )
  })

  it('applies width options to proxied URLs only', () => {
    const external = 'https://example.com/photo.jpg'
    expect(toDirectImageUrl(external, { w: 640 })).toBe(
      `https://wsrv.nl/?url=${encodeURIComponent(external)}&w=640&q=80&output=webp`,
    )
    const r2 = 'https://pub.example.r2.dev/cover.jpg'
    expect(toDirectImageUrl(r2, { w: 640 })).toBe(r2)
  })
})
