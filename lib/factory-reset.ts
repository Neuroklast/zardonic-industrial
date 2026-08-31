/**
 * Factory reset — hard wipe of all editable site content back to defaults.
 *
 * Destructive by design, so this module is deliberately small, explicit, and
 * gated by an admin session PLUS a non-obvious confirmation string that the
 * caller must echo (never stored to anything). It wipes every editorial table
 * and re-seeds `site_config` to the canonical defaults. R2 media is NOT deleted
 * unless `deleteR2Media` is also requested.
 */

/** Must be typed by the operator and echoed to the server action. */
export const FACTORY_RESET_CONFIRM = 'zardonic-factory-reset'

/** Content tables wiped by a factory reset (mirrors SITE_BACKUP_SECTIONS). */
export const FACTORY_RESET_TABLES: readonly string[] = [
  'releases',
  'gigs',
  'gallery',
  'bio',
  'partners',
  'social_links',
  'news_posts',
  'music_highlights',
  'merchandise',
  'soundpacks',
  'media_downloads',
]

/** Keys preserved untouched (never restored / wiped). */
export const FACTORY_RESET_PRESERVED_KEYS = new Set([
  'r2_reconcile_deploy',
  'catalogue_sync',
  'api_secrets',
])

/**
 * Canonical `site_config` defaults a factory reset restores. Fields that were
 * set by the operator (legal identity, analytics consent, translations, custom
 * catalogue IDs) are deliberately reset to safe empty values; the operator must
 * re-enter them.
 */
export interface FactorySiteConfigSeed {
  key: string
  value: unknown
}

export const FACTORY_RESET_SITE_CONFIG: readonly FactorySiteConfigSeed[] = [
  { key: 'hero', value: { headline: 'ZARDONIC', tagline: 'Industrial Metal / Drum & Bass', ctaLabel: 'Listen Now', ctaUrl: '#music' } },
  { key: 'newsletter', value: { heading: 'Mailing List', body: 'Subscribe to get the latest news, releases and exclusive content.' } },
  { key: 'merchandise', value: { footerText: 'Visit the official Zardonic Merchandise Store to get these and more!' } },
  { key: 'footer', value: { legalNoticeUrl: '/legal-notice', privacyPolicyUrl: '/privacy-policy' } },
  { key: 'legal', value: { operatorName: '', street: '', zipCity: '', country: 'Germany', email: '' } },
  { key: 'background', value: {} },
  {
    key: 'appearance',
    value: {
      crtEnabled: true,
      scanlineEnabled: true,
      noiseEnabled: true,
      accentColor: '#dc2626',
      accentColorSecondary: '#7c3aed',
      vignetteOpacity: 0.3,
      chromaticStrength: 0.5,
    },
  },
  {
    key: 'sections',
    value: [
      { id: 'hero', label: 'Hero', visible: true, order: 0 },
      { id: 'bio', label: 'Biography', visible: true, order: 1 },
      { id: 'credits', label: 'Credits & Partners', visible: true, order: 2 },
      { id: 'gallery', label: 'Gallery', visible: true, order: 3 },
      { id: 'media', label: 'Media', visible: true, order: 4 },
      { id: 'music-highlights', label: 'Music Highlights', visible: true, order: 5 },
      { id: 'releases', label: 'Discography', visible: true, order: 6 },
      { id: 'social', label: 'Connect', visible: true, order: 7 },
      { id: 'spotify', label: 'Music Stream', visible: true, order: 8 },
      { id: 'merchandise', label: 'Merchandise', visible: true, order: 9 },
      { id: 'soundpacks', label: 'Soundpacks', visible: true, order: 10 },
      { id: 'gigs', label: 'Events', visible: true, order: 11 },
      { id: 'newsletter', label: 'Newsletter', visible: true, order: 12 },
      { id: 'contact', label: 'Contact', visible: true, order: 13 },
    ],
  },
  { key: 'social', value: { spotify: '', instagram: '', facebook: '', youtube: '', soundcloud: '', tiktok: '' } },
  { key: 'analytics', value: { enabled: false, trackPageViews: false, trackEvents: false } },
  { key: 'translations', value: {} },
  { key: 'languages', value: { enabled: [], fallback: 'en' } },
]

export interface FactoryResetResult {
  deleted: Record<string, number>
  seededCount: number
  skips: string[]
  r2MediaDeleted: boolean
}

/**
 * Minimal structural view of a Supabase client for the reset. `delete()` and
 * `upsert()` on the real client return builders that await to `{ error, count }`
 * / `{ error }`, which is all this module needs.
 */
export interface FactoryResetClient {
  from: (table: string) => {
    delete: (options?: { count?: 'exact' }) => PromiseLike<{ count?: number | null; error: { message: string } | null }>
    upsert: (rows: unknown[]) => PromiseLike<{ error: { message: string } | null }>
  }
}

/**
 * Wipe all content tables and restore default `site_config`. `confirm` must
 * equal the canonical phrase; otherwise this throws before touching data.
 * Never deletes R2 objects unless the caller opts in.
 */
export async function performFactoryReset(
  supabase: FactoryResetClient,
  options: { confirm: string; deleteR2Media: boolean },
): Promise<FactoryResetResult> {
  if (options.confirm !== FACTORY_RESET_CONFIRM) {
    throw new Error('Confirmation phrase did not match; factory reset aborted.')
  }

  const deleted: Record<string, number> = {}
  const skips: string[] = []

  for (const table of FACTORY_RESET_TABLES) {
    const res = await supabase.from(table).delete({ count: 'exact' })
    if (res.error) {
      skips.push(`${table}: ${res.error.message}`)
      continue
    }
    deleted[table] = res.count ?? 0
  }

  // Restore defaults: upsert every canonical seed. Existing non-seed keys left
  // untouched so integration state (e.g. reconcile marker) is not destroyed.
  const seedRows = FACTORY_RESET_SITE_CONFIG.map((seed) => ({
    key: seed.key,
    value: seed.value,
    updated_at: new Date().toISOString(),
  }))
  const seeded = await supabase.from('site_config').upsert(seedRows)
  if (seeded.error) skips.push(`site_config: ${seeded.error.message}`)

  return {
    deleted,
    seededCount: seeded.error ? 0 : seedRows.length,
    skips,
    r2MediaDeleted: Boolean(options.deleteR2Media),
  }
}
