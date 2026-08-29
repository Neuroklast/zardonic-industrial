import { normalizeSearchQuery } from '@/lib/browse-pagination'
import { resolveImageUrl } from '@/lib/r2'

export const MEDIA_CATEGORIES = ['photo', 'logo', 'document', 'audio', 'other'] as const
export type MediaDownloadCategory = (typeof MEDIA_CATEGORIES)[number]
export type MediaCategoryFilter = 'all' | MediaDownloadCategory
export type MediaDownloadKind = 'image' | 'audio' | 'document' | 'other'

export const HOMEPAGE_MEDIA_LIMIT = 8

export const MEDIA_MULTIPART_THRESHOLD_BYTES = 8 * 1024 * 1024

export const MEDIA_SIZE_LIMITS = {
  image: 25 * 1024 * 1024,
  pdf: 25 * 1024 * 1024,
  zip: 100 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
} as const

export const MEDIA_CATEGORY_FILTERS: Array<{ value: MediaCategoryFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'photo', label: 'Photos' },
  { value: 'logo', label: 'Logos' },
  { value: 'document', label: 'Documents' },
  { value: 'audio', label: 'Audio' },
  { value: 'other', label: 'Other' },
]

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
  zip: 'application/zip',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
}

const MIME_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'audio/mp3': 'audio/mpeg',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/vnd.wave': 'audio/wav',
  'application/x-zip-compressed': 'application/zip',
  'application/x-zip': 'application/zip',
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/zip',
  'audio/mpeg',
  'audio/wav',
])

export interface MediaDownloadItem {
  id: string
  title: string
  description: string | null
  category: MediaDownloadCategory
  fileUrl: string | null
  fileMime: string | null
  fileSizeBytes: number | null
  originalFilename: string | null
  displayOrder: number
}

export interface MediaDownloadDbRow {
  id: string
  title: string
  description: string | null
  category: string | null
  file_storage_path: string | null
  file_url: string | null
  file_mime: string | null
  file_size_bytes: number | null
  original_filename: string | null
  display_order: number
  active?: boolean
}

export function isMediaDownloadCategory(value: string): value is MediaDownloadCategory {
  return (MEDIA_CATEGORIES as readonly string[]).includes(value)
}

export function parseMediaCategory(value: unknown): MediaDownloadCategory {
  if (typeof value === 'string' && isMediaDownloadCategory(value)) return value
  return 'other'
}

export function fileExtension(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, '')
  const dot = base.lastIndexOf('.')
  if (dot < 0 || dot === base.length - 1) return ''
  return base.slice(dot + 1).toLowerCase()
}

export function normalizeMime(mime: string | null | undefined, filename?: string | null): string | null {
  const reported = mime?.trim().toLowerCase() ?? ''
  const aliased = reported ? (MIME_ALIASES[reported] ?? reported) : ''
  if (aliased && ALLOWED_MIME.has(aliased)) return aliased

  const ext = filename ? fileExtension(filename) : ''
  const fromExt = ext ? EXT_MIME[ext] : undefined
  return fromExt ?? null
}

export function isAllowedMediaMime(mime: string | null | undefined, filename?: string | null): boolean {
  return normalizeMime(mime, filename) != null
}

export function mediaKindFromMime(
  mime: string | null | undefined,
  filename?: string | null,
): MediaDownloadKind {
  const normalized = normalizeMime(mime, filename)
  if (!normalized) return 'other'
  if (normalized.startsWith('image/')) return 'image'
  if (normalized.startsWith('audio/')) return 'audio'
  if (normalized === 'application/pdf' || normalized === 'application/zip') return 'document'
  return 'other'
}

export function maxBytesForMime(mime: string | null | undefined, filename?: string | null): number {
  const kind = mediaKindFromMime(mime, filename)
  const normalized = normalizeMime(mime, filename)
  if (kind === 'image') return MEDIA_SIZE_LIMITS.image
  if (kind === 'audio') return MEDIA_SIZE_LIMITS.audio
  if (normalized === 'application/zip') return MEDIA_SIZE_LIMITS.zip
  if (normalized === 'application/pdf') return MEDIA_SIZE_LIMITS.pdf
  return MEDIA_SIZE_LIMITS.pdf
}

export function validateMediaUpload(
  mime: string | null | undefined,
  sizeBytes: number,
  filename?: string | null,
): { ok: true; mime: string } | { ok: false; error: string } {
  const normalized = normalizeMime(mime, filename)
  if (!normalized) {
    return { ok: false, error: 'Unsupported file type. Use JPEG, PNG, WebP, GIF, PDF, ZIP, MP3 or WAV.' }
  }
  const max = maxBytesForMime(normalized, filename)
  if (sizeBytes > max) {
    return { ok: false, error: `File too large (max ${Math.round(max / (1024 * 1024))} MB).` }
  }
  return { ok: true, mime: normalized }
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${Math.round(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`
}

export function mapMediaDownloadRow(row: MediaDownloadDbRow): MediaDownloadItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: parseMediaCategory(row.category),
    fileUrl: resolveImageUrl(row.file_storage_path, row.file_url),
    fileMime: row.file_mime,
    fileSizeBytes: row.file_size_bytes,
    originalFilename: row.original_filename,
    displayOrder: row.display_order,
  }
}

export function searchMediaDownloads(items: MediaDownloadItem[], query: string): MediaDownloadItem[] {
  const normalized = normalizeSearchQuery(query)
  if (!normalized) return items

  return items.filter((item) => {
    const haystack = [item.title, item.description ?? '', item.originalFilename ?? '', item.category]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

export function filterMediaByCategory(
  items: MediaDownloadItem[],
  category: MediaCategoryFilter,
): MediaDownloadItem[] {
  if (category === 'all') return items
  return items.filter((item) => item.category === category)
}

export function sortMediaDownloads(items: MediaDownloadItem[]): MediaDownloadItem[] {
  return [...items].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) return left.displayOrder - right.displayOrder
    return left.title.localeCompare(right.title)
  })
}

export function browseMediaDownloads(
  items: MediaDownloadItem[],
  query: string,
  category: MediaCategoryFilter,
): MediaDownloadItem[] {
  return sortMediaDownloads(filterMediaByCategory(searchMediaDownloads(items, query), category))
}

export const MEDIA_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,application/pdf,application/zip,.zip,audio/mpeg,audio/wav,.mp3,.wav'
