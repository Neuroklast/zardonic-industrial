export type CustomTranslations = Record<string, Record<string, string>>

/** Parse site_config.translations overrides for LocaleProvider. */
export function parseTranslationsConfig(raw: unknown): CustomTranslations {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const result: CustomTranslations = {}
  for (const [key, locales] of Object.entries(raw as Record<string, unknown>)) {
    if (!locales || typeof locales !== 'object' || Array.isArray(locales)) continue
    const parsedLocales: Record<string, string> = {}
    for (const [locale, value] of Object.entries(locales as Record<string, unknown>)) {
      if (typeof value === 'string' && value.trim()) {
        parsedLocales[locale] = value
      }
    }
    if (Object.keys(parsedLocales).length > 0) {
      result[key] = parsedLocales
    }
  }
  return result
}