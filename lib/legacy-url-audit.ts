import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Legacy media URLs that point directly at Supabase Storage.
 *
 * Any row where the `*.storage_path` (R2) is empty and the legacy `*_url`
 * column still contains `https://<ref>.supabase.co/storage/...` is served
 * straight from Supabase and counts against the (hard-limited) egress.
 * This lightweight count powers the admin dashboard badge.
 */
export const LEGACY_URL_SCAN_TARGETS = [
  { table: 'releases', column: 'cover_url' },
  { table: 'news_posts', column: 'cover_url' },
  { table: 'gallery', column: 'image_url' },
  { table: 'media_downloads', column: 'file_url' },
  { table: 'merchandise', column: 'image_url' },
  { table: 'soundpacks', column: 'image_url' },
  { table: 'partners', column: 'logo_url' },
  { table: 'social_links', column: 'logo_url' },
] as const

/**
 * Total number of rows (across all media tables) still pointing at the
 * legacy Supabase Storage host. Returns -1 when the scan fails (badges
 * should stay silent on failure, never crash the dashboard).
 */
export async function countLegacySupabaseUrls(supabase: SupabaseClient): Promise<number> {
  try {
    let total = 0
    for (const { table, column } of LEGACY_URL_SCAN_TARGETS) {
      const { count } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .or(`${column}.ilike.%supabase.co%`)
      total += count ?? 0
    }
    return total
  } catch {
    return -1
  }
}
