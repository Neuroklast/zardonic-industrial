import { BUILTIN_LOCALES, type SiteLanguage } from '@/lib/i18n'

export type { SiteLanguage }

const LOCALE_CODE_RE = /^[a-z]{2}(-[a-z]{2})?$/

/** BCP-47-style locale codes: en, de, pt-br */
export function isValidLocaleCode(code: string): boolean {
  return LOCALE_CODE_RE.test(code)
}

/** Parse site_config.languages; falls back to built-in locales when absent or invalid. */
export function parseLanguagesConfig(raw: unknown): SiteLanguage[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...BUILTIN_LOCALES]
  }

  const result: SiteLanguage[] = []
  const seen = new Set<string>()

  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const row = item as Record<string, unknown>
    const code =
      typeof row.code === 'string' ? row.code.trim().toLowerCase() : ''
    const label = typeof row.label === 'string' ? row.label.trim() : ''
    if (!code || !isValidLocaleCode(code) || seen.has(code)) continue
    seen.add(code)
    const builtin = BUILTIN_LOCALES.find((l) => l.code === code)
    result.push({
      code,
      label: label || builtin?.label || code.toUpperCase(),
      flag: builtin?.flag ?? '',
    })
  }

  return result.length > 0 ? result : [...BUILTIN_LOCALES]
}

/** Locale codes enabled on the public site. */
export function getEnabledLocaleCodes(languages: SiteLanguage[]): string[] {
  return languages.map((l) => l.code)
}