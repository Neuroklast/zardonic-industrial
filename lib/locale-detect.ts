/**
 * Public locale resolution:
 * 1. Saved preference (localStorage)
 * 2. Browser Accept-Language / navigator.languages
 * 3. Geo country → locale (when available)
 * 4. English
 */

export const DEFAULT_LOCALE = 'en'

const STORAGE_KEY = 'zd-locale'

/** ISO 3166-1 alpha-2 → preferred built-in locale when that locale is enabled. */
export const COUNTRY_TO_LOCALE: Record<string, string> = {
  DE: 'de',
  AT: 'de',
  CH: 'de',
  LI: 'de',
  RU: 'ru',
  BY: 'ru',
  KZ: 'ru',
  IT: 'it',
  SM: 'it',
  VA: 'it',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  PE: 'es',
  VE: 'es',
  EC: 'es',
  GT: 'es',
  CU: 'es',
  BO: 'es',
  DO: 'es',
  HN: 'es',
  PY: 'es',
  SV: 'es',
  NI: 'es',
  CR: 'es',
  PA: 'es',
  UY: 'es',
  PT: 'pt',
  BR: 'pt',
  AO: 'pt',
  MZ: 'pt',
  JP: 'ja',
  KR: 'ko',
}

/** Map section id → i18n key for compact nav labels. */
export const NAV_LABEL_I18N_KEYS: Record<string, string> = {
  bio: 'nav.bio',
  credits: 'nav.credits',
  gallery: 'nav.gallery',
  'music-highlights': 'nav.music',
  releases: 'nav.releases',
  merchandise: 'nav.merch',
  soundpacks: 'nav.soundpacks',
  gigs: 'nav.events',
  news: 'nav.news',
  newsletter: 'nav.newsletter',
  contact: 'nav.contact',
}

export function readStoredLocale(supported: string[]): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && supported.includes(stored)) return stored
  } catch {
    // ignore
  }
  return null
}

export function writeStoredLocale(locale: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // ignore
  }
}

/** Normalize BCP-47 tag to a supported site code (e.g. de-AT → de). */
export function matchSupportedLocale(tag: string, supported: string[]): string | null {
  const lower = tag.trim().toLowerCase()
  if (!lower) return null
  if (supported.includes(lower)) return lower
  const base = lower.split('-')[0]
  if (supported.includes(base)) return base
  return null
}

/** Pick locale from navigator.languages / language. */
export function localeFromBrowser(supported: string[]): string | null {
  if (typeof navigator === 'undefined') return null
  const candidates: string[] = []
  if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages)
  if (navigator.language) candidates.push(navigator.language)
  for (const tag of candidates) {
    const hit = matchSupportedLocale(tag, supported)
    if (hit) return hit
  }
  return null
}

/** Map geo country code to a supported locale. */
export function localeFromCountry(country: string | null | undefined, supported: string[]): string | null {
  if (!country) return null
  const mapped = COUNTRY_TO_LOCALE[country.toUpperCase()]
  if (mapped && supported.includes(mapped)) return mapped
  return null
}

/**
 * Locale for SSR and the first client render. Must not read localStorage or
 * navigator — those differ from the server and cause React #418 text mismatches.
 */
export function initialPublicLocale(supported: string[]): string {
  const codes = supported.length > 0 ? supported : [DEFAULT_LOCALE]
  return codes.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : codes[0]
}

/**
 * Synchronous best-effort detect (storage → browser → en).
 * Apply only after mount. Geo is applied asynchronously by LocaleProvider after /api/geo.
 */
export function detectLocaleSync(supported: string[]): string {
  const codes = supported.length > 0 ? supported : [DEFAULT_LOCALE]
  return (
    readStoredLocale(codes) ??
    localeFromBrowser(codes) ??
    initialPublicLocale(codes)
  )
}

export async function fetchGeoCountry(): Promise<string | null> {
  try {
    const res = await fetch('/api/geo', { credentials: 'omit' })
    if (!res.ok) return null
    const data = (await res.json()) as { country?: string }
    return typeof data.country === 'string' ? data.country : null
  } catch {
    return null
  }
}
