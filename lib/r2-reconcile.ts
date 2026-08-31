/**
 * Reconcile stored media URLs / storage_paths against objects that actually
 * exist in the current R2 bucket. Matches exact keys first, then unique
 * filename (so a re-upload that dropped prefixes still maps).
 */

import {
  MEDIA_HOST_REWRITE_PAGE_SIZE,
  MEDIA_HOST_REWRITE_SAMPLE_LIMIT,
  MEDIA_HOST_REWRITE_TABLES,
  extractStoredObjectPath,
  normalizeR2PublicHost,
  type MediaHostRewriteSample,
  type MediaHostRewriteTableTarget,
  type MediaRewriteClient,
} from '@/lib/r2-url-rewrite'
import {
  buildR2Inventory,
  matchInventoryKey,
  objectFilename,
  type InventoryMatch,
  type R2Inventory,
} from '@/lib/r2-inventory'
import { contentHashFromKey } from '@/lib/r2-object-key'

const URL_IN_TEXT = /https?:\/\/[^\s"'<>\\]+/gi

export interface R2ReconcileResult {
  publicHost: string
  dryRun: boolean
  objectCount: number
  scannedRows: number
  rewrittenRows: number
  replacements: number
  unmatched: number
  ambiguous: number
  byTable: Record<string, number>
  samples: MediaHostRewriteSample[]
  unmatchedSamples: MediaHostRewriteSample[]
}

export interface R2ReconcileOptions {
  publicHost: string
  objectKeys: readonly string[]
  mediaBucket?: string
  dryRun: boolean
}

function clipSample(value: string, max = 180): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

function emptyResult(publicHost: string, dryRun: boolean, objectCount: number): R2ReconcileResult {
  return {
    publicHost,
    dryRun,
    objectCount,
    scannedRows: 0,
    rewrittenRows: 0,
    replacements: 0,
    unmatched: 0,
    ambiguous: 0,
    byTable: {},
    samples: [],
    unmatchedSamples: [],
  }
}

function pushSample(list: MediaHostRewriteSample[], sample: MediaHostRewriteSample): void {
  if (list.length >= MEDIA_HOST_REWRITE_SAMPLE_LIMIT) return
  list.push({
    ...sample,
    from: clipSample(sample.from),
    to: clipSample(sample.to),
  })
}

function looksLikeOwnedMedia(raw: string): boolean {
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) return false
  if (trimmed.includes('wsrv.nl') || trimmed.includes('weserv.nl')) return true
  if (trimmed.includes('.r2.dev') || trimmed.includes('r2.cloudflarestorage.com')) return true
  if (/^https?:\/\//i.test(raw.trim())) return false
  return true
}

function publicUrlForKey(origin: string, key: string): string {
  return `${origin.replace(/\/$/, '')}/${key.replace(/^\/+/, '')}`
}

function replacementValue(original: string, key: string, origin: string): string {
  const trimmed = original.trim()
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('wsrv.nl') || trimmed.includes('weserv.nl')) {
    return publicUrlForKey(origin, key)
  }
  return key
}

function matchStoredValue(
  raw: string,
  inventory: R2Inventory,
  mediaBucket?: string,
): InventoryMatch {
  const path = extractStoredObjectPath(raw, mediaBucket)
  return matchInventoryKey(path, inventory)
}

function reconcileScalar(
  original: string,
  inventory: R2Inventory,
  origin: string,
  mediaBucket: string | undefined,
  result: R2ReconcileResult,
  loc: { table: string; id: string; field: string },
): string | null {
  const match = matchStoredValue(original, inventory, mediaBucket)
  if (match.status === 'ambiguous') {
    result.ambiguous += 1
    pushSample(result.unmatchedSamples, {
      table: loc.table,
      id: loc.id,
      field: loc.field,
      from: original,
      to: `ambiguous: ${match.candidates.join(', ')}`,
    })
    return null
  }
  if (match.status === 'missing') {
    if (looksLikeOwnedMedia(original) && objectFilename(extractStoredObjectPath(original, mediaBucket) ?? '')) {
      result.unmatched += 1
      pushSample(result.unmatchedSamples, {
        table: loc.table,
        id: loc.id,
        field: loc.field,
        from: original,
        to: 'not in current bucket',
      })
    }
    return null
  }
  const next = replacementValue(original, match.key, origin)
  if (next === original) return null
  return next
}

function reconcileText(
  original: string,
  inventory: R2Inventory,
  origin: string,
  mediaBucket: string | undefined,
  result: R2ReconcileResult,
  loc: { table: string; id: string; field: string },
): { next: string; replacements: number } | null {
  const whole = reconcileScalar(original, inventory, origin, mediaBucket, result, loc)
  if (whole !== null) return { next: whole, replacements: 1 }

  let replacements = 0
  const next = original.replace(URL_IN_TEXT, (found) => {
    const rewritten = reconcileScalar(found, inventory, origin, mediaBucket, result, loc)
    if (!rewritten) return found
    replacements += 1
    return rewritten
  })
  if (replacements === 0) return null
  return { next, replacements }
}

function reconcileJson(
  value: unknown,
  inventory: R2Inventory,
  origin: string,
  mediaBucket: string | undefined,
  result: R2ReconcileResult,
  loc: { table: string; id: string; field: string },
): { value: unknown; replacements: number } {
  if (typeof value === 'string') {
    const rewritten = reconcileText(value, inventory, origin, mediaBucket, result, loc)
    if (!rewritten) return { value, replacements: 0 }
    return { value: rewritten.next, replacements: rewritten.replacements }
  }
  if (Array.isArray(value)) {
    let replacements = 0
    const next = value.map((item) => {
      const nested = reconcileJson(item, inventory, origin, mediaBucket, result, loc)
      replacements += nested.replacements
      return nested.value
    })
    return { value: next, replacements }
  }
  if (value && typeof value === 'object') {
    let replacements = 0
    const next: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const rewritten = reconcileJson(nested, inventory, origin, mediaBucket, result, {
        ...loc,
        field: `${loc.field}.${key}`,
      })
      replacements += rewritten.replacements
      next[key] = rewritten.value
    }
    return { value: next, replacements }
  }
  return { value, replacements: 0 }
}

async function fetchAllRows(
  client: MediaRewriteClient,
  table: string,
  columns: string,
  orderColumn: string,
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = []
  let from = 0
  for (;;) {
    const result = await client
      .from(table)
      .select(columns)
      .order(orderColumn)
      .range(from, from + MEDIA_HOST_REWRITE_PAGE_SIZE - 1)
    if (result.error) throw new Error(`${table}: ${result.error.message}`)
    const batch = result.data ?? []
    rows.push(...batch)
    if (batch.length < MEDIA_HOST_REWRITE_PAGE_SIZE) break
    from += MEDIA_HOST_REWRITE_PAGE_SIZE
  }
  return rows
}

function selectColumnsFor(target: MediaHostRewriteTableTarget): string {
  const columns = new Set<string>([target.idColumn])
  for (const column of target.urlColumns ?? []) columns.add(column)
  for (const column of target.textColumns ?? []) columns.add(column)
  if (target.pathColumn) columns.add(target.pathColumn)
  return [...columns].join(', ')
}

async function reconcileTable(
  client: MediaRewriteClient,
  target: MediaHostRewriteTableTarget,
  inventory: R2Inventory,
  origin: string,
  dryRun: boolean,
  mediaBucket: string | undefined,
  result: R2ReconcileResult,
): Promise<void> {
  const rows = await fetchAllRows(
    client,
    target.table,
    selectColumnsFor(target),
    target.idColumn,
  )
  result.scannedRows += rows.length

  for (const row of rows) {
    const id = row[target.idColumn]
    if (typeof id !== 'string' || !id) continue
    const loc = { table: target.table, id, field: '' }
    const patch: Record<string, unknown> = {}
    let rowReplacements = 0

    if (target.pathColumn) {
      const currentPath = row[target.pathColumn]
      if (typeof currentPath === 'string' && currentPath.trim()) {
        const match = matchInventoryKey(currentPath.trim(), inventory)
        if (match.status === 'matched' && match.key !== currentPath) {
          patch[target.pathColumn] = match.key
          rowReplacements += 1
          pushSample(result.samples, {
            table: target.table,
            id,
            field: target.pathColumn,
            from: currentPath,
            to: match.key,
          })
        } else if (match.status === 'missing') {
          result.unmatched += 1
          pushSample(result.unmatchedSamples, {
            table: target.table,
            id,
            field: target.pathColumn,
            from: currentPath,
            to: 'not in current bucket',
          })
        } else if (match.status === 'ambiguous') {
          result.ambiguous += 1
          pushSample(result.unmatchedSamples, {
            table: target.table,
            id,
            field: target.pathColumn,
            from: currentPath,
            to: `ambiguous: ${match.candidates.join(', ')}`,
          })
        }

        // Backfill the content hash from a content-addressed key regardless of
        // whether the path itself had to be rewritten, so the 404 self-heal can
        // look the object up deterministically later.
        if (target.hashColumn && !(match.status === 'missing' || match.status === 'ambiguous')) {
          const matchedKey = match.status === 'matched' ? match.key : currentPath
          const hash = contentHashFromKey(matchedKey.trim())
          if (hash && row[target.hashColumn] !== hash) {
            patch[target.hashColumn] = hash
          }
        }
      }
    }

    for (const column of target.urlColumns ?? []) {
      const current = row[column]
      if (typeof current !== 'string' || !current) continue
      const next = reconcileScalar(current, inventory, origin, mediaBucket, result, {
        ...loc,
        field: column,
      })
      if (!next) continue
      patch[column] = next
      rowReplacements += 1
      pushSample(result.samples, {
        table: target.table,
        id,
        field: column,
        from: current,
        to: next,
      })

      if (target.pathColumn && patch[target.pathColumn] === undefined) {
        const existingPath = row[target.pathColumn]
        const matched = extractStoredObjectPath(next)
        if (matched && (typeof existingPath !== 'string' || existingPath !== matched)) {
          patch[target.pathColumn] = matched
        }
      }
    }

    for (const column of target.textColumns ?? []) {
      const current = row[column]
      if (typeof current !== 'string' || !current) continue
      const rewritten = reconcileText(current, inventory, origin, mediaBucket, result, {
        ...loc,
        field: column,
      })
      if (!rewritten) continue
      patch[column] = rewritten.next
      rowReplacements += rewritten.replacements
      pushSample(result.samples, {
        table: target.table,
        id,
        field: column,
        from: current,
        to: rewritten.next,
      })
    }

    if (rowReplacements === 0 && Object.keys(patch).length === 0) continue

    if (Object.keys(patch).length > 0) {
      result.rewrittenRows += 1
      result.replacements += Math.max(rowReplacements, 1)
      result.byTable[target.table] = (result.byTable[target.table] ?? 0) + 1
      if (!dryRun) {
        const updated = await client.from(target.table).update(patch).eq(target.idColumn, id)
        if (updated.error) {
          throw new Error(`${target.table} ${id}: ${updated.error.message}`)
        }
      }
    }
  }
}

async function reconcileSiteConfig(
  client: MediaRewriteClient,
  inventory: R2Inventory,
  origin: string,
  dryRun: boolean,
  mediaBucket: string | undefined,
  result: R2ReconcileResult,
): Promise<void> {
  const rows = await fetchAllRows(client, 'site_config', 'key, value', 'key')
  result.scannedRows += rows.length

  for (const row of rows) {
    const key = row.key
    if (typeof key !== 'string' || !key) continue
    if (key === 'r2_reconcile_deploy') continue
    const rewritten = reconcileJson(row.value, inventory, origin, mediaBucket, result, {
      table: 'site_config',
      id: key,
      field: 'value',
    })
    if (rewritten.replacements === 0) continue

    result.rewrittenRows += 1
    result.replacements += rewritten.replacements
    result.byTable.site_config = (result.byTable.site_config ?? 0) + 1
    pushSample(result.samples, {
      table: 'site_config',
      id: key,
      field: 'value',
      from: JSON.stringify(row.value),
      to: JSON.stringify(rewritten.value),
    })

    if (!dryRun) {
      const updated = await client
        .from('site_config')
        .update({ value: rewritten.value })
        .eq('key', key)
      if (updated.error) {
        throw new Error(`site_config ${key}: ${updated.error.message}`)
      }
    }
  }
}

export async function applyR2MediaReconcile(
  client: MediaRewriteClient,
  options: R2ReconcileOptions,
): Promise<R2ReconcileResult> {
  const publicOrigin = normalizeR2PublicHost(options.publicHost)
  if (!publicOrigin) {
    throw new Error('R2_PUBLIC_HOST is missing or invalid')
  }

  const inventory = buildR2Inventory(options.objectKeys)
  const result = emptyResult(publicOrigin, options.dryRun, inventory.keys.size)

  for (const target of MEDIA_HOST_REWRITE_TABLES) {
    await reconcileTable(
      client,
      target,
      inventory,
      publicOrigin,
      options.dryRun,
      options.mediaBucket,
      result,
    )
  }
  await reconcileSiteConfig(
    client,
    inventory,
    publicOrigin,
    options.dryRun,
    options.mediaBucket,
    result,
  )
  return result
}
