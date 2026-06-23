import { describe, expect, it } from 'vitest'
import {
  extractGoogleDriveFileId,
  googleDriveDirectUrl,
  isAllowedRemoteHost,
  resolveRemoteImageUrl,
} from '@/lib/remote-image-url'

describe('remote-image-url', () => {
  it('extracts Google Drive file IDs', () => {
    expect(
      extractGoogleDriveFileId('https://drive.google.com/file/d/abc123XYZ/view?usp=sharing'),
    ).toBe('abc123XYZ')
    expect(extractGoogleDriveFileId('https://drive.google.com/open?id=abc123XYZ')).toBe('abc123XYZ')
  })

  it('builds direct Google Drive download URL', () => {
    expect(googleDriveDirectUrl('abc123')).toBe(
      'https://drive.google.com/uc?export=download&id=abc123',
    )
  })

  it('resolves Google Drive share links', () => {
    const resolved = resolveRemoteImageUrl(
      'https://drive.google.com/file/d/fileId123/view',
    )
    expect(resolved?.source).toBe('google_drive')
    expect(resolved?.url).toContain('fileId123')
  })

  it('allows public HTTPS hosts', () => {
    expect(isAllowedRemoteHost('cdn.example.com')).toBe(true)
    expect(isAllowedRemoteHost('localhost')).toBe(false)
    expect(isAllowedRemoteHost('192.168.1.1')).toBe(false)
  })

  it('resolves direct HTTPS image URLs', () => {
    const resolved = resolveRemoteImageUrl('https://wsrv.nl/?url=https://example.com/a.png')
    expect(resolved?.source).toBe('direct')
  })

  it('rejects non-HTTPS URLs', () => {
    expect(resolveRemoteImageUrl('http://example.com/a.png')).toBeNull()
  })
})