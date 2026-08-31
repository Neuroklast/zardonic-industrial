import { describe, it, expect } from 'vitest'
import {
  contentObjectKey,
  contentHashFromKey,
  sanitizeStoragePrefix,
  safeExtension,
} from '@/lib/r2-object-key'

const bytes = (s: string) => new TextEncoder().encode(s)

describe('sanitizeStoragePrefix', () => {
  it('keeps safe characters and strips separators', () => {
    expect(sanitizeStoragePrefix('background/images')).toBe('background/images')
    expect(sanitizeStoragePrefix('uploads/videos')).toBe('uploads/videos')
    expect(sanitizeStoragePrefix('../../evil')).toBe('evil')
    expect(sanitizeStoragePrefix('a b c')).toBe('abc')
    expect(sanitizeStoragePrefix('')).toBe('uploads')
    expect(sanitizeStoragePrefix('///')).toBe('uploads')
    expect(sanitizeStoragePrefix('foo\\bar')).toBe('foobar')
  })
})

describe('safeExtension', () => {
  it('lowercases, strips non-alphanumerics, falls back', () => {
    expect(safeExtension('webp')).toBe('webp')
    expect(safeExtension('MP4')).toBe('mp4')
    expect(safeExtension('i.v.e.t')).toBe('ivet')
    expect(safeExtension(null)).toBe('bin')
    expect(safeExtension(undefined)).toBe('bin')
    expect(safeExtension('')).toBe('bin')
    expect(safeExtension('.png')).toBe('png')
  })
})

describe('contentObjectKey', () => {
  it('is content-addressed: same bytes -> same key', async () => {
    const a = await contentObjectKey({ prefix: 'uploads', data: bytes('hello'), extension: 'webp' })
    const b = await contentObjectKey({ prefix: 'uploads', data: bytes('hello'), extension: 'webp' })
    expect(a).toBe(b)
  })

  it('different bytes -> different key', async () => {
    const a = await contentObjectKey({ prefix: 'uploads', data: bytes('hello'), extension: 'webp' })
    const b = await contentObjectKey({ prefix: 'uploads', data: bytes('hello!'), extension: 'webp' })
    expect(a).not.toBe(b)
  })

  it('uses the extension and prefix in the key', async () => {
    const key = await contentObjectKey({ prefix: 'background/images', data: bytes('x'), extension: 'MP4' })
    expect(key).toMatch(/^background\/images\/[0-9a-f]{32}\.mp4$/)
  })

  it('honors a custom hashLength and clamps it', async () => {
    const short = await contentObjectKey({ prefix: 'p', data: bytes('y'), extension: 'bin', hashLength: 12 })
    expect(short).toMatch(/^p\/[0-9a-f]{12}\.bin$/)
    const clamped = await contentObjectKey({ prefix: 'p', data: bytes('y'), extension: 'bin', hashLength: 200 })
    expect(clamped.split('/')[1].split('.')[0]).toHaveLength(64)
  })

  it('is deterministic across Buffer and ArrayBuffer views', async () => {
    const buf = bytes('deterministic')
    const arr = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    const fromBuffer = await contentObjectKey({ prefix: 'u', data: buf, extension: 'jpg' })
    const fromArray = await contentObjectKey({ prefix: 'u', data: arr, extension: 'jpg' })
    expect(fromBuffer).toBe(fromArray)
  })
})

describe('contentHashFromKey', () => {
  it('extracts a hash from a content key', () => {
    expect(contentHashFromKey('uploads/abcdef0123456789.webp')).toBe('abcdef0123456789')
    expect(contentHashFromKey('a/b/0123456789abcdef0123456789abcdef.mp4')).toBe(
      '0123456789abcdef0123456789abcdef',
    )
  })

  it('rejects legacy timestamped keys and human filenames', () => {
    expect(contentHashFromKey('uploads/1735390000000.webp')).toBeNull()
    expect(contentHashFromKey('uploads/photo.webp')).toBeNull()
    expect(contentHashFromKey('uploads/')).toBeNull()
    expect(contentHashFromKey('')).toBeNull()
    expect(contentHashFromKey('uploads/1735390000000-1735390000000.mp4')).toBeNull()
  })
})
