import type { createAdminClient } from '@/lib/supabaseAdmin'
import type { CatalogueImportItem } from '@/lib/catalogue-import'
import { releaseTracksAreEmpty } from '@/lib/release-enrichment'
import {
  mergeStreamingLinks,
  type ReleaseMetadata,
  type StreamingLink,
} from '@/lib/release-metadata'

export interface ReleaseConsolidationRow {
  id: string
  title: string
  type: string
  release_date: string | null
  description: string | null
  artists: string[] | null
  streaming_links: unknown
  tracks: unknown
  tracks_source: string | null
  last_enriched_at: string | null
  cover_storage_path: string | null
  cover_url: string | null
  display_order: number | null
  active: boolean | null
  manually_edited: boolean | null
  itunes_id: string | null
  spotify_id: string | null
  discogs_id: string | null
}

export interface ReleaseMatchIndex {
  bySpotifyId: Map<string, ReleaseConsolidationRow>
  byItunesId: Map<string, ReleaseConsolidationRow>
  byDiscogsId: Map<string, ReleaseConsolidationRow>
  byTitleKey: Map<string, ReleaseConsolidationRow[]>
}

export interface ConsolidateReleasesResult {
  merged: number
  deleted: number
  skipped: number
  errors: string[]
}

const ALBUM_FAMILY_TYPES = new Set(['album', 'ep', 'compilation'])

/** Normalize a release title for fuzzy duplicate detection. */
export function normalizeReleaseTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*[-–—]\s*(ep|single|remix(?:es)?|deluxe(?:\s+edition)?|special\s+edition|expanded\s+edition)\s*$/i, '')
    .replace(
      /\s*\((feat\.[^)]*|deluxe[^)]*|expanded[^)]*|remaster(?:ed)?[^)]*|special[^)]*|bonus[^)]*)\)/gi,
      '',
    )
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/[''`]/g, "'")
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function releaseDatesAlign(a: string | null, b: string | null): boolean {
  if (!a || !b) return true
  if (a === b) return true
  if (a.slice(0, 7) === b.slice(0, 7)) return true
  if (a.slice(0, 4) === b.slice(0, 4) && (a.length === 4 || b.length === 4)) return true
  return false
}

function typesCompatible(a: string, b: string): boolean {
  if (a === b) return true
  if (ALBUM_FAMILY_TYPES.has(a) && ALBUM_FAMILY_TYPES.has(b)) return true
  // iTunes singles vs Spotify album listings for the same release
  if (a === 'single' && ALBUM_FAMILY_TYPES.has(b)) return true
  if (b === 'single' && ALBUM_FAMILY_TYPES.has(a)) return true
  return false
}

function sameExternalId(a: ReleaseConsolidationRow, b: ReleaseConsolidationRow): boolean {
  return (
    (Boolean(a.spotify_id) && a.spotify_id === b.spotify_id) ||
    (Boolean(a.itunes_id) && a.itunes_id === b.itunes_id) ||
    (Boolean(a.discogs_id) && a.discogs_id === b.discogs_id)
  )
}

function titleKeysMatch(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const shorter = a.length <= b.length ? a : b
  const longer = a.length > b.length ? a : b
  return longer.startsWith(shorter) && shorter.length >= longer.length * 0.7
}

/** Whether two stored releases represent the same catalogue entry. */
export function releasesAreDuplicates(
  a: ReleaseConsolidationRow,
  b: ReleaseConsolidationRow,
): boolean {
  if (a.id === b.id) return false
  if (sameExternalId(a, b)) return true

  const keyA = normalizeReleaseTitleKey(a.title)
  const keyB = normalizeReleaseTitleKey(b.title)
  if (!titleKeysMatch(keyA, keyB)) return false
  if (!releaseDatesAlign(a.release_date, b.release_date)) return false

  if (typesCompatible(a.type, b.type)) return true
  return a.release_date !== null && a.release_date === b.release_date
}

function metadataAsConsolidationRow(metadata: ReleaseMetadata): ReleaseConsolidationRow {
  return {
    id: '',
    title: metadata.title,
    type: metadata.type || 'album',
    release_date: metadata.release_date,
    description: metadata.description,
    artists: metadata.artists,
    streaming_links: metadata.streaming_links,
    tracks: metadata.tracks ?? [],
    tracks_source: null,
    last_enriched_at: null,
    cover_storage_path: null,
    cover_url: metadata.coverUrl,
    display_order: null,
    active: true,
    manually_edited: false,
    itunes_id: metadata.itunes_id ?? null,
    spotify_id: metadata.spotify_id ?? null,
    discogs_id: metadata.discogs_id ?? null,
  }
}

function streamingLinkCount(links: unknown): number {
  return Array.isArray(links) ? links.length : 0
}

/** Prefer the row with the richest data (and manual edits). */
export function scoreReleaseForCanonical(row: ReleaseConsolidationRow): number {
  let score = 0
  if (row.manually_edited) score += 1000
  if (!releaseTracksAreEmpty(row.tracks)) score += 100 + streamingLinkCount(row.tracks)
  if (row.spotify_id) score += 10
  if (row.itunes_id) score += 10
  if (row.discogs_id) score += 10
  if (row.cover_storage_path) score += 50
  if (row.cover_url) score += 15
  score += streamingLinkCount(row.streaming_links) * 3
  if (row.description?.trim()) score += 5
  if (typeof row.display_order === 'number') score -= row.display_order * 0.01
  return score
}

export function buildReleaseMatchIndex(rows: ReleaseConsolidationRow[]): ReleaseMatchIndex {
  const index: ReleaseMatchIndex = {
    bySpotifyId: new Map(),
    byItunesId: new Map(),
    byDiscogsId: new Map(),
    byTitleKey: new Map(),
  }

  for (const row of rows) {
    if (row.spotify_id) index.bySpotifyId.set(row.spotify_id, row)
    if (row.itunes_id) index.byItunesId.set(row.itunes_id, row)
    if (row.discogs_id) index.byDiscogsId.set(row.discogs_id, row)

    const titleKey = normalizeReleaseTitleKey(row.title)
    if (!titleKey) continue
    const bucket = index.byTitleKey.get(titleKey) ?? []
    bucket.push(row)
    index.byTitleKey.set(titleKey, bucket)
  }

  return index
}

export function addReleaseToMatchIndex(
  index: ReleaseMatchIndex,
  row: ReleaseConsolidationRow,
): void {
  if (row.spotify_id) index.bySpotifyId.set(row.spotify_id, row)
  if (row.itunes_id) index.byItunesId.set(row.itunes_id, row)
  if (row.discogs_id) index.byDiscogsId.set(row.discogs_id, row)

  const titleKey = normalizeReleaseTitleKey(row.title)
  if (!titleKey) return
  const bucket = index.byTitleKey.get(titleKey) ?? []
  if (!bucket.some((entry) => entry.id === row.id)) {
    bucket.push(row)
    index.byTitleKey.set(titleKey, bucket)
  }
}

function collectTitleCandidates(
  index: ReleaseMatchIndex,
  titleKey: string,
): ReleaseConsolidationRow[] {
  const seen = new Set<string>()
  const candidates: ReleaseConsolidationRow[] = []

  const add = (row: ReleaseConsolidationRow) => {
    if (seen.has(row.id)) return
    seen.add(row.id)
    candidates.push(row)
  }

  for (const row of index.byTitleKey.get(titleKey) ?? []) add(row)

  for (const [key, rows] of index.byTitleKey) {
    if (key === titleKey) continue
    if (titleKeysMatch(titleKey, key)) {
      for (const row of rows) add(row)
    }
  }

  return candidates
}

/** Find an existing release row for an incoming catalogue item. */
export function findExistingReleaseForImport(
  metadata: ReleaseMetadata,
  index: ReleaseMatchIndex,
): ReleaseConsolidationRow | null {
  if (metadata.spotify_id) {
    const hit = index.bySpotifyId.get(metadata.spotify_id)
    if (hit) return hit
  }
  if (metadata.itunes_id) {
    const hit = index.byItunesId.get(metadata.itunes_id)
    if (hit) return hit
  }
  if (metadata.discogs_id) {
    const hit = index.byDiscogsId.get(metadata.discogs_id)
    if (hit) return hit
  }

  const probe = metadataAsConsolidationRow(metadata)
  const titleKey = normalizeReleaseTitleKey(metadata.title)
  if (!titleKey) return null

  for (const candidate of collectTitleCandidates(index, titleKey)) {
    if (releasesAreDuplicates(candidate, probe)) return candidate
  }

  return null
}

function scoreImportItem(item: CatalogueImportItem): number {
  let score = 0
  const metadata = item.metadata
  if (metadata.tracks?.length) score += metadata.tracks.length * 5
  if (metadata.spotify_id) score += 10
  if (metadata.itunes_id) score += 10
  if (metadata.discogs_id) score += 10
  if (metadata.coverUrl) score += 5
  if (metadata.type === 'album' || metadata.type === 'ep') score += 3
  score += streamingLinkCount(metadata.streaming_links)
  return score
}

/** Collapse duplicate staged catalogue items before import (e.g. Spotify album groups). */
export function dedupeCatalogueImportItems(items: CatalogueImportItem[]): CatalogueImportItem[] {
  const groups = new Map<string, CatalogueImportItem[]>()

  for (const item of items) {
    const key = normalizeReleaseTitleKey(item.metadata.title)
    const bucket = groups.get(key) ?? []
    bucket.push(item)
    groups.set(key, bucket)
  }

  const deduped: CatalogueImportItem[] = []
  for (const group of groups.values()) {
    if (group.length === 1) {
      deduped.push(group[0])
      continue
    }
    deduped.push(group.reduce((best, current) =>
      scoreImportItem(current) > scoreImportItem(best) ? current : best,
    ))
  }

  return deduped
}

export function groupDuplicateReleases(rows: ReleaseConsolidationRow[]): ReleaseConsolidationRow[][] {
  const parent = rows.map((_, index) => index)

  const find = (index: number): number => {
    if (parent[index] !== index) parent[index] = find(parent[index])
    return parent[index]
  }

  const union = (left: number, right: number) => {
    const rootLeft = find(left)
    const rootRight = find(right)
    if (rootLeft !== rootRight) parent[rootRight] = rootLeft
  }

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      if (rows[i].manually_edited && rows[j].manually_edited) continue
      if (releasesAreDuplicates(rows[i], rows[j])) union(i, j)
    }
  }

  const groups = new Map<number, ReleaseConsolidationRow[]>()
  for (let i = 0; i < rows.length; i++) {
    const root = find(i)
    const group = groups.get(root) ?? []
    group.push(rows[i])
    groups.set(root, group)
  }

  return [...groups.values()].filter((group) => group.length > 1)
}

export function buildConsolidatedReleaseUpdate(
  canonical: ReleaseConsolidationRow,
  duplicate: ReleaseConsolidationRow,
): Record<string, unknown> | null {
  const update: Record<string, unknown> = {}
  let changed = false

  const fillId = (
    field: 'spotify_id' | 'itunes_id' | 'discogs_id',
    canonicalValue: string | null,
    duplicateValue: string | null,
  ) => {
    if (!canonicalValue && duplicateValue) {
      update[field] = duplicateValue
      changed = true
    }
  }

  fillId('spotify_id', canonical.spotify_id, duplicate.spotify_id)
  fillId('itunes_id', canonical.itunes_id, duplicate.itunes_id)
  fillId('discogs_id', canonical.discogs_id, duplicate.discogs_id)

  const existingLinks = Array.isArray(canonical.streaming_links)
    ? (canonical.streaming_links as StreamingLink[])
    : []
  const duplicateLinks = Array.isArray(duplicate.streaming_links)
    ? (duplicate.streaming_links as StreamingLink[])
    : []
  const mergedLinks = mergeStreamingLinks(existingLinks, duplicateLinks)
  if (mergedLinks.length > existingLinks.length) {
    update.streaming_links = mergedLinks
    changed = true
  }

  if (releaseTracksAreEmpty(canonical.tracks) && !releaseTracksAreEmpty(duplicate.tracks)) {
    update.tracks = duplicate.tracks
    if (duplicate.tracks_source) update.tracks_source = duplicate.tracks_source
    if (duplicate.last_enriched_at) update.last_enriched_at = duplicate.last_enriched_at
    changed = true
  }

  if (!canonical.cover_storage_path && duplicate.cover_storage_path) {
    update.cover_storage_path = duplicate.cover_storage_path
    changed = true
  }
  if (!canonical.cover_url && duplicate.cover_url) {
    update.cover_url = duplicate.cover_url
    changed = true
  }

  if (!canonical.description?.trim() && duplicate.description?.trim()) {
    update.description = duplicate.description
    changed = true
  }

  const canonicalArtists = canonical.artists ?? []
  const duplicateArtists = duplicate.artists ?? []
  if (duplicateArtists.length > canonicalArtists.length) {
    const mergedArtists = [...new Set([...canonicalArtists, ...duplicateArtists])]
    if (mergedArtists.length > canonicalArtists.length) {
      update.artists = mergedArtists
      changed = true
    }
  }

  if (!canonical.manually_edited && duplicate.release_date && !canonical.release_date) {
    update.release_date = duplicate.release_date
    changed = true
  }

  return changed ? update : null
}

const CONSOLIDATION_SELECT =
  'id, title, type, release_date, description, artists, streaming_links, tracks, tracks_source, last_enriched_at, cover_storage_path, cover_url, display_order, active, manually_edited, itunes_id, spotify_id, discogs_id'

/** Merge duplicate release rows in Supabase and delete redundant copies. */
export async function consolidateDuplicateReleases(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<ConsolidateReleasesResult> {
  const result: ConsolidateReleasesResult = {
    merged: 0,
    deleted: 0,
    skipped: 0,
    errors: [],
  }

  const { data, error } = await supabase
    .from('releases')
    .select(CONSOLIDATION_SELECT)
    .order('display_order', { ascending: true })

  if (error) {
    result.errors.push(error.message)
    return result
  }

  const rows = (data ?? []) as ReleaseConsolidationRow[]
  const groups = groupDuplicateReleases(rows)

  for (const group of groups) {
    const sorted = [...group].sort(
      (a, b) => scoreReleaseForCanonical(b) - scoreReleaseForCanonical(a),
    )
    const canonical = sorted[0]
    const duplicates = sorted.slice(1)

    for (const duplicate of duplicates) {
      const update = buildConsolidatedReleaseUpdate(canonical, duplicate)
      if (update) {
        const { error: updateError } = await supabase
          .from('releases')
          .update(update)
          .eq('id', canonical.id)

        if (updateError) {
          result.errors.push(
            `Failed to merge "${duplicate.title}" into "${canonical.title}": ${updateError.message}`,
          )
          result.skipped++
          continue
        }

        Object.assign(canonical, update)
        result.merged++
      }

      const { error: deleteError } = await supabase.from('releases').delete().eq('id', duplicate.id)
      if (deleteError) {
        result.errors.push(`Failed to delete duplicate "${duplicate.title}": ${deleteError.message}`)
        result.skipped++
        continue
      }

      result.deleted++
    }
  }

  return result
}