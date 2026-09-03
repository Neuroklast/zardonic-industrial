import { MEDIA_BUCKET } from '@/lib/constants'
import { contentObjectKey } from '@/lib/r2-object-key'
import { isLegacySupabaseStorageUrl } from '@/lib/r2'
import {
  buildR2Inventory,
  matchInventoryKey,
  type R2Inventory,
} from '@/lib/r2-inventory'
import { getStorageProvider, type StorageProvider } from '@/lib/storage'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  mimeFromExtension,
  parseSupabaseStorageObject,
  storagePrefixForObject,
} from '@/lib/legacy-url-migration'

/**
 * Core migration logic shared by the CLI script
 * (`scripts/r2-migrate-legacy-urls.ts`) and the production deploy runner
 * (`lib/legacy-url-migration-on-deploy.ts`).
 *
 * Moves every row whose legacy `*_url` column still points at Supabase Storage
 * onto R2:
 *   1. row already has a storage path   → clear the legacy URL
 *   2. object already in R2 (hash/file) → reuse the existing key (no copy)
 *   3. otherwise                        → download bytes once from Supabase,
 *                                         store under a content-addressed key
 *                                         (legacy folder preserved), update DB
 */

export interface LegacyUrlTableTarget {
  table: string
  idColumn: string
  storageColumn: string
  urlColumn: string
  label: string
  fallbackPrefix: string
}

export const LEGACY_URL_TABLE_TARGETS: LegacyUrlTableTarget[] = [
  { table: 'releases', idColumn: 'id', storageColumn: 'cover_storage_path', urlColumn: 'cover_url', label: 'Release covers', fallbackPrefix: 'releases' },
  { table: 'news_posts', idColumn: 'id', storageColumn: 'cover_storage_path', urlColumn: 'cover_url', label: 'News covers', fallbackPrefix: 'news' },
  { table: 'gallery', idColumn: 'id', storageColumn: 'storage_path', urlColumn: 'image_url', label: 'Gallery images', fallbackPrefix: 'gallery' },
  { table: 'media_downloads', idColumn: 'id', storageColumn: 'file_storage_path', urlColumn: 'file_url', label: 'Media downloads', fallbackPrefix: 'media' },
  { table: 'merchandise', idColumn: 'id', storageColumn: 'image_storage_path', urlColumn: 'image_url', label: 'Merchandise', fallbackPrefix: 'merch' },
  { table: 'soundpacks', idColumn: 'id', storageColumn: 'image_storage_path', urlColumn: 'image_url', label: 'Soundpacks', fallbackPrefix: 'soundpacks' },
  { table: 'partners', idColumn: 'id', storageColumn: 'logo_storage_path', urlColumn: 'logo_url', label: 'Partner logos', fallbackPrefix: 'partners/logos' },
  { table: 'social_links', idColumn: 'id', storageColumn: 'logo_storage_path', urlColumn: 'logo_url', label: 'Social logos', fallbackPrefix: 'social/logos' },
]

export interface LegacyUrlInlineTarget {
  configKey: string
  storageField: string
  urlField: string
  fallbackPrefix: string
}

export const LEGACY_URL_INLINE_TARGETS: LegacyUrlInlineTarget[] = [
  { configKey: 'background', storageField: 'storage_path', urlField: 'url', fallbackPrefix: 'background' },
  { configKey: 'background', storageField: 'video_storage_path', urlField: 'video_url', fallbackPrefix: 'background-video' },
  { configKey: 'background', storageField: 'video_mobile_storage_path', urlField: 'video_mobile_url', fallbackPrefix: 'background-video-mobile' },
]

export interface LegacyUrlMigrationResult {
  scanned: number
  /** Storage path was already set — legacy URL cleared. */
  cleaned: number
  /** Existing R2 object reused — no bytes copied. */
  reused: number
  /** Bytes downloaded from Supabase and uploaded to R2. */
  copied: number
  /** Rows without any legacy URL. */
  unchanged: number
  /** Rows that could not be migrated (download/DB error). */
  failed: number
  failures: string[]
  byLabel: Record<string, number>
}

export interface LegacyUrlMigrationOptions {
  /** Service-role (admin) client — reads and writes the media tables. */
  supabase: SupabaseClient
  /** R2 storage provider. Omit to construct it from env (throws if missing). */
  storage?: StorageProvider
  /** R2 object keys (inventory) — pass [] to copy every object. */
  objectKeys: readonly string[]
  apply: boolean
  log?: (line: string) => void
}

type MigrationOutcome = { type: 'matched' | 'copied'; key: string } | { type: 'failed'; reason: string }

async function migrateUrlValue(
  storage: StorageProvider,
  inventory: R2Inventory,
  sourceUrl: string,
  fallbackPrefix: string,
): Promise<MigrationOutcome> {
  const parsed = parseSupabaseStorageObject(sourceUrl)
  if (!parsed) {
    return { type: 'failed', reason: `unrecognised Supabase Storage URL: ${sourceUrl}` }
  }

  const match = matchInventoryKey(parsed.objectKey, inventory)
  if (match.status === 'matched') return { type: 'matched', key: match.key }
  if (match.status === 'ambiguous') {
    return { type: 'failed', reason: `ambiguous R2 match for "${parsed.objectKey}" (${match.candidates.join(', ')})` }
  }

  const res = await fetch(sourceUrl)
  if (!res.ok) return { type: 'failed', reason: `download failed (${res.status}) for ${sourceUrl}` }
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length === 0) return { type: 'failed', reason: `empty response for ${sourceUrl}` }

  const contentType =
    res.headers.get('content-type')?.split(';', 1)[0] ||
    mimeFromExtension(parsed.extension)
  const key = await contentObjectKey({
    prefix: storagePrefixForObject(parsed.objectKey, fallbackPrefix),
    data: buffer,
    extension: parsed.extension,
  })

  await storage.uploadObject(MEDIA_BUCKET, key, buffer, contentType)
  return { type: 'copied', key }
}

export async function migrateLegacySupabaseUrlsToR2(
  options: LegacyUrlMigrationOptions,
): Promise<LegacyUrlMigrationResult> {
  const { supabase, storage: storageOverride, objectKeys, apply } = options
  const log = options.log ?? ((_line: string) => {})
  const storage = storageOverride ?? getStorageProvider()
  const inventory = buildR2Inventory(objectKeys)

  const result: LegacyUrlMigrationResult = {
    scanned: 0,
    cleaned: 0,
    reused: 0,
    copied: 0,
    unchanged: 0,
    failed: 0,
    failures: [],
    byLabel: {},
  }

  const update = (label: string, delta: Partial<LegacyUrlMigrationResult>) => {
    for (const [k, v] of Object.entries(delta)) {
      if (k !== 'failures' && k !== 'byLabel') {
        (result[k as keyof LegacyUrlMigrationResult] as number) += (v as number) ?? 0
      }
    }
    result.byLabel[label] = (result.byLabel[label] ?? 0) + 1
  }

  // --- site_config inline fields (background image/video) ---
  for (const target of LEGACY_URL_INLINE_TARGETS) {
    const { data } = await supabase
      .from('site_config')
      .select('key, value')
      .eq('key', target.configKey)
      .maybeSingle()

    const value = data?.value as Record<string, unknown> | null
    if (!value) continue

    const url = value[target.urlField]
    if (typeof url !== 'string' || !isLegacySupabaseStorageUrl(url)) continue

    result.scanned++
    log(`[site_config.${target.configKey}] ${target.urlField}: ${url}`)
    try {
      const outcome = await migrateUrlValue(storage, inventory, url, target.fallbackPrefix)
      if (outcome.type === 'failed') {
        result.failed++
        result.failures.push(`${target.configKey}.${target.urlField}: ${outcome.reason}`)
        continue
      }
      if (outcome.type === 'matched') {
        result.reused++
      } else {
        result.copied++
      }
      result.cleaned++
      if (!apply) continue
      const { error } = await supabase
        .from('site_config')
        .update({
          value: {
            ...value,
            [target.storageField]: outcome.key,
            [target.urlField]: null,
          },
        })
        .eq('key', target.configKey)
      if (error) {
        result.failed++
        result.failures.push(`site_config.${target.configKey}.${target.urlField}: DB update failed — ${error.message}`)
      }
    } catch (err) {
      result.failed++
      result.failures.push(
        `${target.configKey}.${target.urlField}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  // --- per-table rows ---
  for (const target of LEGACY_URL_TABLE_TARGETS) {
    const { data: rows, error } = await supabase
      .from(target.table)
      .select(`${target.idColumn}, ${target.storageColumn}, ${target.urlColumn}`)
    if (error) {
      log(`  ${target.label}: select failed — ${error.message}`)
      continue
    }

    for (const row of (rows ?? []) as unknown as Array<Record<string, unknown>>) {
      const id = row[target.idColumn]
      const url = row[target.urlColumn]
      const storageValue = row[target.storageColumn]
      const hidden = `  [${target.label}] ${String(id)}`

      if (typeof url !== 'string' || !isLegacySupabaseStorageUrl(url)) {
        result.unchanged++
        continue
      }
      result.scanned++

      if (typeof storageValue === 'string' && storageValue) {
        result.cleaned++
        update(target.label, {})
        if (!apply) continue
        const { error: upErr } = await supabase
          .from(target.table)
          .update({ [target.urlColumn]: null })
          .eq(target.idColumn, id)
        if (upErr) {
          result.failed++
          result.failures.push(`${target.table} ${id}: ${upErr.message}`)
        } else {
          log(`  ${hidden} URL cleared (storage path already set)`)
        }
        continue
      }

      try {
        const outcome = await migrateUrlValue(storage, inventory, url, target.fallbackPrefix)
        if (outcome.type === 'failed') {
          result.failed++
          result.failures.push(`${target.table} ${id}: ${outcome.reason}`)
          continue
        }
        if (outcome.type === 'matched') {
          result.reused++
        } else {
          result.copied++
        }
        update(target.label, {})
        if (!apply) continue
        const { error: upErr } = await supabase
          .from(target.table)
          .update({ [target.storageColumn]: outcome.key, [target.urlColumn]: null })
          .eq(target.idColumn, id)
        if (upErr) {
          result.failed++
          result.failures.push(`${target.table} ${id}: DB update failed — ${upErr.message}`)
        }
      } catch (err) {
        result.failed++
        result.failures.push(`${target.table} ${id}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  return result
}
