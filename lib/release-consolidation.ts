import type { createAdminClient } from '@/lib/supabaseAdmin'
import type { CatalogueImportItem } from '@/lib/catalogue-import'
import { parseCatalogueSyncConfig } from '@/lib/catalogue-sync-config'
import { releaseTracksAreEmpty } from '@/lib/release-enrichment'
import {
  hasComplementaryExternalIds,
  normalizeReleaseTitleKey,
  releaseDatesAlign,
  releasesMatchByCoverArt,
  releaseTitleKeysMatch,
  sharedStreamingFingerprint,
  type ReleaseTitleMatchOptions,
} from '@/lib/release-title-match'
import {
  mergeStreamingLinks,
  type ReleaseMetadata,
  type StreamingLink,
} from '@/lib/release-metadata'
import { coverSourceScore, resolveMergedCoverUpdate } from '@/lib/release-cover-art'
import { deleteReleaseCoversFromR2 } from '@/lib/release-cover-r2'
import { externalIdsFromStreamingLinks } from '@/lib/release-streaming-enrichment'
import { parseStreamingLinks } from '@/lib/release-public-mapper'

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

export type { ReleaseTitleMatchOptions } from '@/lib/release-title-match'
export { normalizeReleaseTitleKey } from '@/lib/release-title-match'

const ALBUM_FAMILY_TYPES = new Set(['album', 'ep', 'compilation'])
const LOOSE_CATALOGUE_TYPES = new Set(['album', 'ep', 'compilation', 'single', 'remix'])

function typesCompatible(a: string, b: string): boolean {
  if (a === b) return true
  if (ALBUM_FAMILY_TYPES.has(a) && ALBUM_FAMILY_TYPES.has(b)) return true
  if (LOOSE_CATALOGUE_TYPES.has(a) && LOOSE_CATALOGUE_TYPES.has(b)) return true
  return false
}

function titleKeysMatch(
  a: string,
  b: string,
  options?: ReleaseTitleMatchOptions,
): boolean {
  return releaseTitleKeysMatch(
    normalizeReleaseTitleKey(a, options),
    normalizeReleaseTitleKey(b, options),
  )
}

/** Whether two stored releases represent the same catalogue entry. */
export function releasesAreDuplicates(
  a: ReleaseConsolidationRow,
  b: ReleaseConsolidationRow,
  options?: ReleaseTitleMatchOptions,
): boolean {
  if (a.id && b.id && a.id === b.id) return false

  const sharedFingerprint = sharedStreamingFingerprint(a, b)
  if (sharedFingerprint) return true

  if (releasesMatchByCoverArt(a, b, options)) return true

  const keysMatch = titleKeysMatch(a.title, b.title, options)
  const datesAlign = releaseDatesAlign(a.release_date, b.release_date)
  const complementaryIds = hasComplementaryExternalIds(a, b)

  if (keysMatch && complementaryIds) return true
  if (!keysMatch) return false

  return datesAlign && typesCompatible(a.type, b.type)
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
    cover_url: metadata.coverUrl ?? null,
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
  score += Math.max(0, coverSourceScore(row))
  if (row.cover_storage_path) score += 20
  if (row.cover_url) score += 5
  score += streamingLinkCount(row.streaming_links) * 3
  if (row.description?.trim()) score += 5
  if (typeof row.display_order === 'number') score -= row.display_order * 0.01
  return score
}

export function buildReleaseMatchIndex(
  rows: ReleaseConsolidationRow[],
  options?: ReleaseTitleMatchOptions,
): ReleaseMatchIndex {
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

    const titleKey = normalizeReleaseTitleKey(row.title, options)
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
  options?: ReleaseTitleMatchOptions,
): void {
  if (row.spotify_id) index.bySpotifyId.set(row.spotify_id, row)
  if (row.itunes_id) index.byItunesId.set(row.itunes_id, row)
  if (row.discogs_id) index.byDiscogsId.set(row.discogs_id, row)

  const titleKey = normalizeReleaseTitleKey(row.title, options)
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
  options?: ReleaseTitleMatchOptions,
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
    if (releaseTitleKeysMatch(titleKey, key)) {
      for (const row of rows) add(row)
    }
  }

  return candidates
}

/** Find an existing release row for an incoming catalogue item. */
export function findExistingReleaseForImport(
  metadata: ReleaseMetadata,
  index: ReleaseMatchIndex,
  options?: ReleaseTitleMatchOptions,
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
  const titleKey = normalizeReleaseTitleKey(metadata.title, options)
  if (!titleKey) return null

  for (const candidate of collectTitleCandidates(index, titleKey, options)) {
    if (releasesAreDuplicates(candidate, probe, options)) return candidate
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
export function dedupeCatalogueImportItems(
  items: CatalogueImportItem[],
  options?: ReleaseTitleMatchOptions,
): CatalogueImportItem[] {
  if (items.length <= 1) return items

  const parent = items.map((_, index) => index)
  const find = (index: number): number => {
    if (parent[index] !== index) parent[index] = find(parent[index])
    return parent[index]
  }
  const union = (left: number, right: number) => {
    const rootLeft = find(left)
    const rootRight = find(right)
    if (rootLeft !== rootRight) parent[rootRight] = rootLeft
  }

  const probes = items.map((item) => metadataAsConsolidationRow(item.metadata))

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (releasesAreDuplicates(probes[i], probes[j], options)) union(i, j)
    }
  }

  const groups = new Map<number, CatalogueImportItem[]>()
  for (let i = 0; i < items.length; i++) {
    const root = find(i)
    const group = groups.get(root) ?? []
    group.push(items[i])
    groups.set(root, group)
  }

  const deduped: CatalogueImportItem[] = []
  for (const group of groups.values()) {
    if (group.length === 1) {
      deduped.push(group[0])
      continue
    }
    deduped.push(
      group.reduce((best, current) =>
        scoreImportItem(current) > scoreImportItem(best) ? current : best,
      ),
    )
  }

  return deduped
}

export function groupDuplicateReleases(
  rows: ReleaseConsolidationRow[],
  options?: ReleaseTitleMatchOptions,
): ReleaseConsolidationRow[][] {
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
      if (releasesAreDuplicates(rows[i], rows[j], options)) union(i, j)
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

export interface ConsolidatedReleaseUpdateResult {
  update: Record<string, unknown> | null
  coverPathsToDiscard: string[]
}

export function buildConsolidatedReleaseUpdate(
  canonical: ReleaseConsolidationRow,
  duplicate: ReleaseConsolidationRow,
): ConsolidatedReleaseUpdateResult {
  const update: Record<string, unknown> = {}
  let changed = false
  const coverMerge = resolveMergedCoverUpdate(canonical, duplicate)

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

  const linkedIds = externalIdsFromStreamingLinks(parseStreamingLinks(mergedLinks), canonical)
  if (!canonical.spotify_id && linkedIds.spotify_id) {
    update.spotify_id = linkedIds.spotify_id
    changed = true
  }
  if (!canonical.itunes_id && linkedIds.itunes_id) {
    update.itunes_id = linkedIds.itunes_id
    changed = true
  }
  if (!canonical.discogs_id && linkedIds.discogs_id) {
    update.discogs_id = linkedIds.discogs_id
    changed = true
  }

  if (releaseTracksAreEmpty(canonical.tracks) && !releaseTracksAreEmpty(duplicate.tracks)) {
    update.tracks = duplicate.tracks
    if (duplicate.tracks_source) update.tracks_source = duplicate.tracks_source
    if (duplicate.last_enriched_at) update.last_enriched_at = duplicate.last_enriched_at
    changed = true
  }

  if (coverMerge.update) {
    if (coverMerge.update.cover_storage_path !== undefined) {
      update.cover_storage_path = coverMerge.update.cover_storage_path
      changed = true
    }
    if (coverMerge.update.cover_url !== undefined) {
      update.cover_url = coverMerge.update.cover_url
      changed = true
    }
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

  return {
    update: changed ? update : null,
    coverPathsToDiscard: coverMerge.discardPaths,
  }
}

const CONSOLIDATION_SELECT =
  'id, title, type, release_date, description, artists, streaming_links, tracks, tracks_source, last_enriched_at, cover_storage_path, cover_url, display_order, active, manually_edited, itunes_id, spotify_id, discogs_id'

const MAX_CONSOLIDATION_PASSES = 20
const MAX_MANUAL_MERGE_SELECTION = 20

const PLATFORM_ID_FIELDS: Array<{
  field: 'spotify_id' | 'itunes_id' | 'discogs_id'
  label: string
}> = [
  { field: 'spotify_id', label: 'Spotify' },
  { field: 'itunes_id', label: 'iTunes' },
  { field: 'discogs_id', label: 'Discogs' },
]

function findConflictingPlatformIds(rows: ReleaseConsolidationRow[]): string | null {
  for (const { field, label } of PLATFORM_ID_FIELDS) {
    const ids = [
      ...new Set(
        rows
          .map((row) => row[field])
          .filter((id): id is string => typeof id === 'string' && id.length > 0),
      ),
    ]
    if (ids.length > 1) {
      return `Conflicting ${label} album IDs — these are different releases on ${label}, not duplicates.`
    }
  }
  return null
}

/**
 * Returns a human-readable rejection reason when a manual merge selection is not
 * semantically safe. Null means the group may be merged.
 */
export function findManualMergeRejectionReason(
  rows: ReleaseConsolidationRow[],
  options?: ReleaseTitleMatchOptions,
): string | null {
  if (rows.length < 2) {
    return 'Select at least two releases to merge.'
  }

  const platformConflict = findConflictingPlatformIds(rows)
  if (platformConflict) return platformConflict

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

  let hasDuplicateEdge = false
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      if (releasesAreDuplicates(rows[i], rows[j], options)) {
        union(i, j)
        hasDuplicateEdge = true
      }
    }
  }

  if (!hasDuplicateEdge) {
    return `“${rows[0].title}” and “${rows[1].title}” do not appear to be the same catalogue entry.`
  }

  const roots = new Set(rows.map((_, index) => find(index)))
  if (roots.size !== 1) {
    return 'Selected releases are not all related — some pairs have unrelated titles, dates, or platform data.'
  }

  return null
}

export function pickCanonicalReleaseRow(rows: ReleaseConsolidationRow[]): ReleaseConsolidationRow {
  return [...rows].sort((a, b) => scoreReleaseForCanonical(b) - scoreReleaseForCanonical(a))[0]
}

export interface ManualMergeResult extends ConsolidateReleasesResult {
  canonicalId?: string
  rejected?: string
}

/** Merge an admin-selected group after semantic validation. */
export async function mergeManualReleaseSelection(
  supabase: ReturnType<typeof createAdminClient>,
  releaseIds: string[],
  options?: ReleaseTitleMatchOptions,
): Promise<ManualMergeResult> {
  const empty: ManualMergeResult = { merged: 0, deleted: 0, skipped: 0, errors: [] }

  if (releaseIds.length < 2) {
    return { ...empty, rejected: 'Select at least two releases to merge.' }
  }
  if (releaseIds.length > MAX_MANUAL_MERGE_SELECTION) {
    return {
      ...empty,
      rejected: `Select at most ${MAX_MANUAL_MERGE_SELECTION} releases per merge.`,
    }
  }

  const uniqueIds = [...new Set(releaseIds)]
  if (uniqueIds.length !== releaseIds.length) {
    return { ...empty, rejected: 'Duplicate selections are not allowed.' }
  }

  const matchOptions = options ?? (await loadTitleMatchOptions(supabase))

  const { data, error } = await supabase
    .from('releases')
    .select(CONSOLIDATION_SELECT)
    .in('id', uniqueIds)

  if (error) {
    return { ...empty, errors: [error.message], rejected: error.message }
  }

  const rows = (data ?? []) as ReleaseConsolidationRow[]
  if (rows.length !== uniqueIds.length) {
    return { ...empty, rejected: 'One or more selected releases were not found.' }
  }

  const rejection = findManualMergeRejectionReason(rows, matchOptions)
  if (rejection) {
    return { ...empty, rejected: rejection }
  }

  const canonical = pickCanonicalReleaseRow(rows)
  const result: ManualMergeResult = { merged: 0, deleted: 0, skipped: 0, errors: [] }
  await mergeDuplicateGroups(supabase, [rows], result)
  result.canonicalId = canonical.id

  if (result.deleted === 0 && result.skipped > 0) {
    result.rejected = result.errors[0] ?? 'Merge failed.'
  }

  return result
}

async function loadTitleMatchOptions(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<ReleaseTitleMatchOptions> {
  const { data } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'catalogue_sync')
    .maybeSingle()

  const config = parseCatalogueSyncConfig(data?.value)
  return { artistNames: [config.artistName] }
}

async function mergeDuplicateGroups(
  supabase: ReturnType<typeof createAdminClient>,
  groups: ReleaseConsolidationRow[][],
  result: ConsolidateReleasesResult,
): Promise<void> {
  for (const group of groups) {
    const sorted = [...group].sort(
      (a, b) => scoreReleaseForCanonical(b) - scoreReleaseForCanonical(a),
    )
    const canonical = sorted[0]
    const duplicates = sorted.slice(1)

    for (const duplicate of duplicates) {
      const { update, coverPathsToDiscard } = buildConsolidatedReleaseUpdate(canonical, duplicate)
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

      const r2Cleanup = await deleteReleaseCoversFromR2(coverPathsToDiscard)
      for (const path of r2Cleanup.errors) {
        result.errors.push(`Failed to delete orphaned cover "${path}" from R2`)
      }
    }
  }
}

/** Merge duplicate release rows in Supabase and delete redundant copies. */
export async function consolidateDuplicateReleases(
  supabase: ReturnType<typeof createAdminClient>,
  options?: ReleaseTitleMatchOptions,
): Promise<ConsolidateReleasesResult> {
  const result: ConsolidateReleasesResult = {
    merged: 0,
    deleted: 0,
    skipped: 0,
    errors: [],
  }

  const matchOptions = options ?? (await loadTitleMatchOptions(supabase))

  for (let pass = 0; pass < MAX_CONSOLIDATION_PASSES; pass++) {
    const { data, error } = await supabase
      .from('releases')
      .select(CONSOLIDATION_SELECT)
      .order('display_order', { ascending: true })

    if (error) {
      result.errors.push(error.message)
      return result
    }

    const rows = (data ?? []) as ReleaseConsolidationRow[]
    const groups = groupDuplicateReleases(rows, matchOptions)
    if (groups.length === 0) break

    const deletedBefore = result.deleted
    const skippedBefore = result.skipped
    await mergeDuplicateGroups(supabase, groups, result)
    if (result.deleted === deletedBefore && result.skipped === skippedBefore) break
  }

  return result
}