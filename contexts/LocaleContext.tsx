'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { type Locale, type SiteLanguage, t as translate, BUILTIN_LOCALES } from '@/lib/i18n'
import {
  DEFAULT_LOCALE,
  detectLocaleSync,
  fetchGeoCountry,
  localeFromCountry,
  readStoredLocale,
  writeStoredLocale,
} from '@/lib/locale-detect'

export type { Locale, SiteLanguage }
export { BUILTIN_LOCALES as LOCALES }

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  languages: SiteLanguage[]
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  children,
  customTranslations,
  languages: configuredLanguages,
}: {
  children: ReactNode
  customTranslations?: Record<string, Record<string, string>>
  languages?: SiteLanguage[]
}) {
  const languages = useMemo(
    () => (configuredLanguages && configuredLanguages.length > 0 ? configuredLanguages : BUILTIN_LOCALES),
    [configuredLanguages],
  )
  const supportedCodes = useMemo(() => languages.map((l) => l.code), [languages])

  const [locale, setLocaleState] = useState<Locale>(() => detectLocaleSync(supportedCodes))
  const resolvedLocale = supportedCodes.includes(locale) ? locale : (supportedCodes.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : (supportedCodes[0] ?? DEFAULT_LOCALE))

  // Geo: only when user has no stored preference — apply country locale if supported, else keep browser/en
  useEffect(() => {
    if (readStoredLocale(supportedCodes)) return
    let cancelled = false
    void (async () => {
      const country = await fetchGeoCountry()
      if (cancelled) return
      const fromGeo = localeFromCountry(country, supportedCodes)
      if (!fromGeo) return
      // Do not override if user already picked a language this session
      if (readStoredLocale(supportedCodes)) return
      setLocaleState(fromGeo)
    })()
    return () => {
      cancelled = true
    }
  }, [supportedCodes])

  useEffect(() => {
    document.documentElement.lang = resolvedLocale
  }, [resolvedLocale])

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (!supportedCodes.includes(newLocale)) return
      setLocaleState(newLocale)
      writeStoredLocale(newLocale)
    },
    [supportedCodes],
  )

  const t = useCallback(
    (key: string) => {
      const custom = customTranslations?.[key]?.[resolvedLocale]
      if (custom !== undefined && custom !== '') return custom
      return translate(key, resolvedLocale)
    },
    [resolvedLocale, customTranslations],
  )

  return (
    <LocaleContext value={{ locale: resolvedLocale, setLocale, t, languages }}>
      {children}
    </LocaleContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider')
  return ctx
}
