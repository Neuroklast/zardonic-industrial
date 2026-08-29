/**
 * Full-site JSON backup (admin Data Import/Export).
 *
 * Includes every editorial content table (releases with `manually_edited`,
 * news posts, drafts/inactive rows, complete `site_config`). Excludes
 * secrets, auth profiles, analytics events, sync jobs, and newsletter PII.
 */

export const SITE_BACKUP_VERSION = 2
export const SITE_BACKUP_PAGE_SIZE = 1000
export const SITE_BACKUP_UPSERT_CHUNK = 200
/** Stay under Next server-action / Vercel ~4.5 MB body limit, with JSON overhead. */
export const SITE_BACKUP_MAX_CHUNK_BYTES = 2_500_000

export type SiteBackupRow = Record<string, unknown>

export interface SiteBackupSelectResult {
  data: SiteBackupRow[] | null
  error: { message: string } | null
  count?: number | null
}

export interface SiteBackupSelectQuery {
  order: (column: string) => SiteBackupSelectQuery
  range: (from: number, to: number) => PromiseLike<SiteBackupSelectResult>
}

export interface SiteBackupFrom {
  select: (
    columns: string,
    options?: { count?: 'exact'; head?: boolean },
  ) => SiteBackupSelectQuery & PromiseLike<SiteBackupSelectResult>
  upsert: (
    rows: SiteBackupRow[],
    options?: { onConflict?: string },
  ) => PromiseLike<{ error: { message: string } | null }>
  insert: (rows: SiteBackupRow[]) => PromiseLike<{ error: { message: string } | null }>
}

export interface SiteBackupClient {
  from: (table: string) => SiteBackupFrom
}

export interface SiteBackupSection {
  table: string
  /** Canonical key written into new (v2) export files. */
  exportKey: string
  /** Keys accepted on import (v1 aliases + canonical). */
  importKeys: string[]
  onConflict: 'id' | 'key'
  /** Column used for stable PostgREST pagination (`range` requires an order). */
  orderColumn: 'id' | 'key'
  /** Unique columns that must be NULL rather than '' (Postgres UNIQUE). */
  emptyToNull?: string[]
}

/** Editorial tables included in a full backup. Order is import order. */
export const SITE_BACKUP_SECTIONS: readonly SiteBackupSection[] = [
  {
    table: 'releases',
    exportKey: 'releases',
    importKeys: ['releases'],
    onConflict: 'id',
    orderColumn: 'id',
    emptyToNull: ['itunes_id', 'spotify_id', 'discogs_id'],
  },
  {
    table: 'gigs',
    exportKey: 'gigs',
    importKeys: ['gigs'],
    onConflict: 'id',
    orderColumn: 'id',
    emptyToNull: ['bandsintown_id'],
  },
  {
    table: 'gallery',
    exportKey: 'gallery',
    importKeys: ['gallery'],
    onConflict: 'id',
    orderColumn: 'id',
  },
  {
    table: 'bio',
    exportKey: 'bio',
    importKeys: ['bio'],
    onConflict: 'id',
    orderColumn: 'id',
  },
  {
    table: 'partners',
    exportKey: 'partners',
    importKeys: ['partners'],
    onConflict: 'id',
    orderColumn: 'id',
  },
  {
    table: 'social_links',
    exportKey: 'social_links',
    importKeys: ['social_links', 'social'],
    onConflict: 'id',
    orderColumn: 'id',
  },
  {
    table: 'news_posts',
    exportKey: 'news_posts',
    importKeys: ['news_posts', 'news'],
    onConflict: 'id',
    orderColumn: 'id',
  },
  {
    table: 'music_highlights',
    exportKey: 'music_highlights',
    importKeys: ['music_highlights', 'musicHighlights'],
    onConflict: 'id',
    orderColumn: 'id',
  },
  {
    table: 'merchandise',
    exportKey: 'merchandise',
    importKeys: ['merchandise'],
    onConflict: 'id',
    orderColumn: 'id',
  },
  {
    table: 'soundpacks',
    exportKey: 'soundpacks',
    importKeys: ['soundpacks'],
    onConflict: 'id',
    orderColumn: 'id',
  },
  {
    table: 'media_downloads',
    exportKey: 'media_downloads',
    importKeys: ['media_downloads'],
    onConflict: 'id',
    orderColumn: 'id',
  },
  {
    table: 'site_config',
    exportKey: 'site_config',
    importKeys: ['site_config', 'config'],
    onConflict: 'key',
    orderColumn: 'key',
  },
] as const

export const SITE_BACKUP_EXCLUDED = [
  'api_secrets',
  'profiles',
  'analytics_events',
  'sync_jobs',
  'newsletter_subscribers',
] as const

export interface SiteBackupFile {
  version: number
  exportedAt: string
  counts: Record<string, number>
  releases?: SiteBackupRow[]
  gigs?: SiteBackupRow[]
  gallery?: SiteBackupRow[]
  bio?: SiteBackupRow[] | SiteBackupRow | null
  partners?: SiteBackupRow[]
  social_links?: SiteBackupRow[]
  social?: SiteBackupRow[]
  news_posts?: SiteBackupRow[]
  news?: SiteBackupRow[]
  music_highlights?: SiteBackupRow[]
  musicHighlights?: SiteBackupRow[]
  merchandise?: SiteBackupRow[]
  soundpacks?: SiteBackupRow[]
  site_config?: SiteBackupRow[]
  config?: SiteBackupRow[]
  [key: string]: unknown
}

export interface SiteBackupParseResult {
  ok: true
  data: SiteBackupFile
}

export interface SiteBackupParseError {
  ok: false
  error: string
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRowArray(value: unknown): value is SiteBackupRow[] {
  return Array.isArray(value) && value.every((item) => isPlainObject(item))
}

export function rowsFromBackupValue(value: unknown): SiteBackupRow[] {
  if (value == null) return []
  if (isRowArray(value)) return value
  if (isPlainObject(value)) return [value]
  return []
}

export function parseSiteBackupPayload(input: unknown): SiteBackupParseResult | SiteBackupParseError {
  if (!isPlainObject(input)) {
    return { ok: false, error: 'Backup file must be a JSON object' }
  }

  const data = input as SiteBackupFile
  const hasAnySection = SITE_BACKUP_SECTIONS.some((section) =>
    section.importKeys.some((key) => key in data && data[key] != null),
  )
  if (!hasAnySection) {
    return { ok: false, error: 'Backup file contains no recognised site data tables' }
  }

  for (const section of SITE_BACKUP_SECTIONS) {
    for (const key of section.importKeys) {
      if (!(key in data) || data[key] == null) continue
      const value = data[key]
      if (section.table === 'bio') {
        if (!isPlainObject(value) && !isRowArray(value)) {
          return { ok: false, error: `${key} must be an object or array of rows` }
        }
        continue
      }
      if (!isRowArray(value)) {
        return { ok: false, error: `${key} must be an array of rows` }
      }
    }
  }

  return { ok: true, data }
}

export function listPresentBackupSections(payload: SiteBackupFile): SiteBackupSection[] {
  return SITE_BACKUP_SECTIONS.filter((section) =>
    section.importKeys.some((key) => key in payload && payload[key] != null),
  )
}

export function pickSectionRows(payload: SiteBackupFile, section: SiteBackupSection): SiteBackupRow[] {
  for (const key of section.importKeys) {
    if (key in payload && payload[key] != null) {
      return rowsFromBackupValue(payload[key])
    }
  }
  return []
}

export function sliceBackupPayload(
  payload: SiteBackupFile,
  section: SiteBackupSection,
): Record<string, unknown> {
  const rows = pickSectionRows(payload, section)
  return {
    version: payload.version ?? SITE_BACKUP_VERSION,
    [section.exportKey]: rows,
  }
}

function emptyToNull(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export function normalizeRowForUpsert(section: SiteBackupSection, row: SiteBackupRow): SiteBackupRow {
  const next: SiteBackupRow = { ...row }
  for (const column of section.emptyToNull ?? []) {
    if (column in next) next[column] = emptyToNull(next[column])
  }
  if (section.table === 'news_posts') {
    const slug = emptyToNull(next.slug)
    if (slug == null) {
      next.slug = `post-${typeof next.id === 'string' && next.id ? next.id.slice(0, 8) : 'imported'}`
    } else {
      next.slug = slug
    }
    if (typeof next.title !== 'string' || next.title.trim() === '') {
      next.title = String(next.slug)
    }
  }
  if (section.table === 'site_config' && next.updated_at == null) {
    next.updated_at = new Date().toISOString()
  }
  return next
}

export function rowHasConflictKey(section: SiteBackupSection, row: SiteBackupRow): boolean {
  const value = row[section.onConflict]
  if (typeof value === 'string') return value.trim().length > 0
  return value != null
}

export function chunkRows<T>(rows: T[], size = SITE_BACKUP_UPSERT_CHUNK): T[][] {
  if (rows.length === 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size))
  }
  return chunks
}

function utf8ByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length
}

/** Split rows so each JSON payload stays under the server-action body limit. */
export function chunkRowsByJsonBytes<T>(
  rows: T[],
  maxBytes = SITE_BACKUP_MAX_CHUNK_BYTES,
): T[][] {
  if (rows.length === 0) return []
  const chunks: T[][] = []
  let current: T[] = []
  let currentBytes = 2
  for (const row of rows) {
    const rowBytes = utf8ByteLength(row) + 1
    if (current.length > 0 && currentBytes + rowBytes > maxBytes) {
      chunks.push(current)
      current = []
      currentBytes = 2
    }
    current.push(row)
    currentBytes += rowBytes
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

export async function fetchAllTableRows(
  client: SiteBackupClient,
  table: string,
  pageSize = SITE_BACKUP_PAGE_SIZE,
  orderColumn = 'id',
): Promise<SiteBackupRow[]> {
  const rows: SiteBackupRow[] = []
  let from = 0
  for (;;) {
    const result = await client
      .from(table)
      .select('*')
      .order(orderColumn)
      .range(from, from + pageSize - 1)
    if (result.error) {
      throw new Error(`${table}: ${result.error.message}`)
    }
    const batch = result.data ?? []
    rows.push(...batch)
    if (batch.length < pageSize) break
    from += pageSize
  }
  return rows
}

export async function countTableRows(client: SiteBackupClient, table: string): Promise<number> {
  const result = await client.from(table).select('*', { count: 'exact', head: true })
  if (result.error) {
    throw new Error(`${table}: ${result.error.message}`)
  }
  if (typeof result.count === 'number') return result.count
  // Stub / clients without head-count: fall back to a full fetch.
  const section = SITE_BACKUP_SECTIONS.find((item) => item.table === table)
  const rows = await fetchAllTableRows(
    client,
    table,
    SITE_BACKUP_PAGE_SIZE,
    section?.orderColumn ?? 'id',
  )
  return rows.length
}

export async function buildSiteBackupCounts(
  client: SiteBackupClient,
): Promise<{ counts: Record<string, number>; warnings: string[] }> {
  const counts: Record<string, number> = {}
  const warnings: string[] = []
  for (const section of SITE_BACKUP_SECTIONS) {
    try {
      counts[section.exportKey] = await countTableRows(client, section.table)
    } catch (error) {
      counts[section.exportKey] = 0
      warnings.push(error instanceof Error ? error.message : `${section.table}: unknown error`)
    }
  }
  return { counts, warnings }
}

export async function buildSiteBackup(client: SiteBackupClient): Promise<SiteBackupFile> {
  const file: SiteBackupFile = {
    version: SITE_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    counts: {},
  }

  for (const section of SITE_BACKUP_SECTIONS) {
    const rows = await fetchAllTableRows(client, section.table, SITE_BACKUP_PAGE_SIZE, section.orderColumn)
    file[section.exportKey] = rows
    file.counts[section.exportKey] = rows.length
  }

  return file
}

export function backupDownloadFileName(now = new Date()): string {
  return `zardonic-export-${now.toISOString().slice(0, 10)}.json`
}

export interface ApplySiteBackupResult {
  imported: Record<string, number>
}

export async function applySiteBackup(
  client: SiteBackupClient,
  payload: SiteBackupFile,
): Promise<ApplySiteBackupResult> {
  const imported: Record<string, number> = {}
  const sections = listPresentBackupSections(payload)

  for (const section of sections) {
    const rawRows = pickSectionRows(payload, section)
    const normalized = rawRows.map((row) => normalizeRowForUpsert(section, row))
    const withKey = normalized.filter((row) => rowHasConflictKey(section, row))
    const withoutKey = normalized.filter((row) => !rowHasConflictKey(section, row))

    if (withKey.length > 0) {
      for (const chunk of chunkRows(withKey)) {
        const { error } = await client.from(section.table).upsert(chunk, { onConflict: section.onConflict })
        if (error) throw new Error(`${section.table}: ${error.message}`)
      }
    }

    if (withoutKey.length > 0 && section.table === 'bio') {
      const existing = await client.from('bio').select('id').order('id').range(0, 0)
      if (existing.error) throw new Error(`bio: ${existing.error.message}`)
      const existingId = existing.data?.[0]?.id
      for (const row of withoutKey) {
        if (typeof row.content !== 'string') continue
        const payloadRow: SiteBackupRow = {
          content: row.content,
          updated_at: row.updated_at ?? new Date().toISOString(),
        }
        if (typeof existingId === 'string' && existingId) {
          const { error } = await client
            .from('bio')
            .upsert([{ id: existingId, ...payloadRow }], { onConflict: 'id' })
          if (error) throw new Error(`bio: ${error.message}`)
        } else {
          const { error } = await client.from('bio').insert([payloadRow])
          if (error) throw new Error(`bio: ${error.message}`)
        }
        withKey.push(row)
      }
    }

    if (withKey.length === 0) continue
    imported[section.table] = withKey.length
  }

  return { imported }
}
