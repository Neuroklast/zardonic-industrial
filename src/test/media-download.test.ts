import { describe, expect, it } from 'vitest'
import {
  browseMediaDownloads,
  filterMediaByCategory,
  formatFileSize,
  mediaKindFromMime,
  normalizeMime,
  parseMediaCategory,
  searchMediaDownloads,
  validateMediaUpload,
  type MediaDownloadItem,
} from '@/lib/media-download'

function item(overrides: Partial<MediaDownloadItem> = {}): MediaDownloadItem {
  return {
    id: overrides.id ?? '1',
    title: overrides.title ?? 'Press photo',
    description: overrides.description ?? null,
    category: overrides.category ?? 'photo',
    fileUrl: overrides.fileUrl ?? 'https://cdn.example/a.jpg',
    fileMime: overrides.fileMime ?? 'image/jpeg',
    fileSizeBytes: overrides.fileSizeBytes ?? 1200,
    originalFilename: overrides.originalFilename ?? 'press.jpg',
    displayOrder: overrides.displayOrder ?? 0,
  }
}

describe('normalizeMime', () => {
  it('accepts allowed types and aliases', () => {
    expect(normalizeMime('image/jpeg')).toBe('image/jpeg')
    expect(normalizeMime('image/jpg')).toBe('image/jpeg')
    expect(normalizeMime('audio/x-wav')).toBe('audio/wav')
    expect(normalizeMime('application/x-zip-compressed')).toBe('application/zip')
  })

  it('infers from filename when browser mime is empty', () => {
    expect(normalizeMime('', 'radio-edit.mp3')).toBe('audio/mpeg')
    expect(normalizeMime(null, 'kit.ZIP')).toBe('application/zip')
  })

  it('rejects unknown types', () => {
    expect(normalizeMime('video/mp4')).toBeNull()
    expect(normalizeMime('', 'script.exe')).toBeNull()
  })
})

describe('mediaKindFromMime', () => {
  it('maps mime to click kind independently of category', () => {
    expect(mediaKindFromMime('image/png')).toBe('image')
    expect(mediaKindFromMime('audio/mpeg')).toBe('audio')
    expect(mediaKindFromMime('application/pdf')).toBe('document')
    expect(mediaKindFromMime('application/zip', 'photos.zip')).toBe('document')
  })
})

describe('validateMediaUpload', () => {
  it('rejects oversize files using the mime family limit', () => {
    const tooBigImage = validateMediaUpload('image/jpeg', 26 * 1024 * 1024, 'hi.jpg')
    expect(tooBigImage.ok).toBe(false)
    const okZip = validateMediaUpload('application/zip', 90 * 1024 * 1024, 'kit.zip')
    expect(okZip.ok).toBe(true)
  })
})

describe('parseMediaCategory', () => {
  it('falls back to other', () => {
    expect(parseMediaCategory('logo')).toBe('logo')
    expect(parseMediaCategory('nope')).toBe('other')
    expect(parseMediaCategory(null)).toBe('other')
  })
})

describe('browseMediaDownloads', () => {
  const items = [
    item({ id: 'a', title: 'Stage photo', category: 'photo', displayOrder: 2 }),
    item({
      id: 'b',
      title: 'Tech rider',
      category: 'document',
      fileMime: 'application/pdf',
      originalFilename: 'rider.pdf',
      displayOrder: 1,
    }),
    item({ id: 'c', title: 'Logo pack', category: 'logo', displayOrder: 0 }),
  ]

  it('filters by category and searches title/filename', () => {
    expect(filterMediaByCategory(items, 'logo').map((row) => row.id)).toEqual(['c'])
    expect(searchMediaDownloads(items, 'rider').map((row) => row.id)).toEqual(['b'])
  })

  it('sorts by display order then title', () => {
    expect(browseMediaDownloads(items, '', 'all').map((row) => row.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('formatFileSize', () => {
  it('formats compact sizes', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
    expect(formatFileSize(null)).toBe('')
  })
})
