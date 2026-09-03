import { describe, expect, it } from 'vitest'
import { parseSupabaseStorageObject, storagePrefixForObject, mimeFromExtension } from '@/lib/legacy-url-migration'

describe('parseSupabaseStorageObject', () => {
  it('extracts bucket and object key from a public storage URL', () => {
    const parsed = parseSupabaseStorageObject(
      'https://xyzabc.supabase.co/storage/v1/object/public/media/press-kit.zip',
    )
    expect(parsed).toEqual({ bucket: 'media', objectKey: 'press-kit.zip', extension: 'zip' })
  })

  it('handles nested keys and percent-encoding', () => {
    const parsed = parseSupabaseStorageObject(
      'https://xyzabc.supabase.co/storage/v1/object/public/images/2024/foto%20web.jpg',
    )
    expect(parsed).toEqual({ bucket: 'images', objectKey: '2024/foto web.jpg', extension: 'jpg' })
  })

  it('extracts the last path segment when a real bucket prefix is used', () => {
    const parsed = parseSupabaseStorageObject(
      'https://xyzabc.supabase.co/storage/v1/object/public/media/releases/cover/abcdef.png',
    )
    expect(parsed?.bucket).toBe('media')
    expect(parsed?.objectKey).toBe('releases/cover/abcdef.png')
  })

  it('is tolerant of signed-prefixed and query URLs', () => {
    expect(
      parseSupabaseStorageObject(
        'https://xyzabc.supabase.co/storage/v1/object/public/media/a.mp3?v=123',
      )?.objectKey,
    ).toBe('a.mp3')
    expect(parseSupabaseStorageObject('https://pub-x.r2.dev/media/a.mp3')).toBeNull()
    expect(parseSupabaseStorageObject(null)).toBeNull()
    expect(parseSupabaseStorageObject('not-a-url')).toBeNull()
  })

  it('returns null on malformed percent-encoding', () => {
    expect(
      parseSupabaseStorageObject('https://xyz.supabase.co/storage/v1/object/public/media/a%zz.jpg'),
    ).toBeNull()
  })
})

describe('storagePrefixForObject', () => {
  it('preserves the legacy folder structure', () => {
    expect(storagePrefixForObject('images/2024/foto.jpg', 'gallery')).toBe('images/2024')
  })

  it('falls back to the table prefix when the key has no folder', () => {
    expect(storagePrefixForObject('cover.jpg', 'releases')).toBe('releases')
  })

  it('sanitizes the prefix', () => {
    expect(storagePrefixForObject('foo::bar//baz x.png', 'gallery')).toBe('foobar')
  })
})

describe('mimeFromExtension', () => {
  it('maps known extensions to content types', () => {
    expect(mimeFromExtension('JPG')).toBe('image/jpeg')
    expect(mimeFromExtension('zip')).toBe('application/zip')
    expect(mimeFromExtension('wav')).toBe('audio/wav')
    expect(mimeFromExtension('svg')).toBe('image/svg+xml')
  })

  it('falls back to octet-stream', () => {
    expect(mimeFromExtension(null)).toBe('application/octet-stream')
    expect(mimeFromExtension('xyz')).toBe('application/octet-stream')
  })
})
