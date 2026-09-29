import type { SupabaseClient } from '@supabase/supabase-js'
import {
  classifyReleaseType,
  hasExplicitReleaseTypeSignal,
  type ReleaseTypeValue,
} from '@/lib/release-type'
import { normalizeReleaseType, parseReleaseTracks } from '@/lib/release-public-mapper'

export interface ReclassifyReleaseRow {
  id: string
  title: string
  type: string | null
  tracks: unknown
  manually_edited: boolean | null
}

export interface ReclassifyChange {
  id: string
  title: string
  from: string
  to: ReleaseTypeValue
  trackCount: number | null
}

export interface ReclassifyReleasesResult {
  scanned: number
  changed: number
  applied: number
  skippedManual: number
  unchanged: number
  changes: ReclassifyChange[]
  errors: string[]
}

/**
 * Plans a type correction for one release, or null when it should be left
 * alone. Rows are only reclassified when there is an *explicit* signal
 * (remix/compilation marker, Apple suffix, or a track count) — a bare title
 * must never silently rewrite a curated value to the 'album' fallback.
 */
export function planReleaseTypeChange(row: ReclassifyReleaseRow): ReclassifyChange | null {
  if (row.manually_edited) return null

  const trackCount = parseReleaseTracks(row.tracks).length
  const signals = {
    title: row.title,
    trackCount: trackCount > 0 ? trackCount : null,
  }
  if (!hasExplicitReleaseTypeSignal(signals)) return null

  const next = classifyReleaseType(signals)
  const current = normalizeReleaseType(row.type ?? '') ?? ''
  if (next === current) return null

  return {
    id: row.id,
    title: row.title,
    from: current,
    to: next,
    trackCount: signals.trackCount,
  }
}

const PAGE_SIZE = 1000

/**
 * Re-runs the canonical classifier over every stored release. Dry-run by
 * default; pass `apply: true` to persist. Manually edited rows are skipped.
 */
export async function reclassifyReleaseTypes(options: {
  supabase: SupabaseClient
  apply: boolean
  log?: (line: string) => void
}): Promise<ReclassifyReleasesResult> {
  const { supabase, apply } = options
  const log = options.log ?? (() => {})

  const result: ReclassifyReleasesResult = {
    scanned: 0,
    changed: 0,
    applied: 0,
    skippedManual: 0,
    unchanged: 0,
    changes: [],
    errors: [],
  }

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('releases')
      .select('id, title, type, tracks, manually_edited')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      result.errors.push(error.message)
      break
    }

    const rows = (data ?? []) as ReclassifyReleaseRow[]
    if (rows.length === 0) break

    for (const row of rows) {
      result.scanned++

      if (row.manually_edited) {
        result.skippedManual++
        continue
      }

      const change = planReleaseTypeChange(row)
      if (!change) {
        result.unchanged++
        continue
      }

      result.changed++
      result.changes.push(change)
      log(
        `  ${change.from || '(empty)'} → ${change.to}  "${change.title}"` +
          (change.trackCount != null ? ` [${change.trackCount} tracks]` : ''),
      )

      if (!apply) continue

      const { error: updateError } = await supabase
        .from('releases')
        .update({ type: change.to })
        .eq('id', change.id)

      if (updateError) {
        result.errors.push(`Failed to update "${change.title}": ${updateError.message}`)
        continue
      }
      result.applied++
    }

    if (rows.length < PAGE_SIZE) break
  }

  return result
}
