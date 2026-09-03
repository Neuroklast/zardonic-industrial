import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  browseMediaDownloads,
  filterMediaByCategory,
  formatFileSize,
  mapMediaDownloadRow,
  mediaKindFromMime,
  normalizeMime,
  parseMediaCategory,
  searchMediaDownloads,
  validateMediaUpload,
  type MediaDownloadDbRow,
  type MediaDownloadItem,
} from '@/lib/media-download'
import { isLegacySupabaseStorageUrl } from '@/lib/r2'

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

describe('mapMediaDownloadRow', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

  afterEach(() => {
    warnSpy.mockClear()
  })

  function dbRow(overrides: Partial<MediaDownloadDbRow> = {}): MediaDownloadDbRow {
    return {
      id: 'row-1',
      title: 'Press kit',
      description: null,
      category: 'document',
      file_storage_path: null,
      file_url: null,
      file_mime: 'application/zip',
      file_size_bytes: 1_000_000,
      original_filename: 'kit.zip',
      display_order: 0,
      ...overrides,
    }
  }

  it('prefers the R2 storage path and keeps legacy r2.dev URLs canonicalized', () => {
    process.env.R2_PUBLIC_HOST = 'https://pub-test.r2.dev'
    const row = dbRow({ file_storage_path: 'media/kit.zip' })
    const item = mapMediaDownloadRow(row)
    expect(item.fileUrl).toBe('https://pub-test.r2.dev/media/kit.zip')
  })

  it('hides rows whose file_url still points at Supabase Storage (egress guard)', () => {
    const row = dbRow({ file_url: 'https://xyzabc.supabase.co/storage/v1/object/public/media/kit.zip' })
    const item = mapMediaDownloadRow(row)
    expect(item.fileUrl).toBeNull()
    expect(warnSpy).toHaveBeenCalled()
  })

  it('keeps non-Supabase legacy fallback URLs', () => {
    const row = dbRow({ file_url: 'https://files.example.com/kit.zip' })
    const item = mapMediaDownloadRow(row)
    expect(item.fileUrl).toBe('https://files.example.com/kit.zip')
    expect(warnSpy).not.toHaveBeenCalled()
  })
})

describe('isLegacySupabaseStorageUrl', () => {
  it('detects supabase.co hosts only', () => {
    expect(isLegacySupabaseStorageUrl('https://xyzabc.supabase.co/storage/v1/object/public/a.zip')).toBe(true)
    expect(isLegacySupabaseStorageUrl('https://pub-example.r2.dev/media/a.zip')).toBe(false)
    expect(isLegacySupabaseStorageUrl('https://files.example.com/a.zip')).toBe(false)
    expect(isLegacySupabaseStorageUrl(null)).toBe(false)
    expect(isLegacySupabaseStorageUrl('https://not-a-url.example')).toBe(false)
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
