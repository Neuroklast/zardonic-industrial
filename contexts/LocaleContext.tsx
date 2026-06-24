'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { type Locale, type SiteLanguage, t as translate, BUILTIN_LOCALES } from '@/lib/i18n'

export type { Locale, SiteLanguage }
export { BUILTIN_LOCALES as LOCALES }

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  languages: SiteLanguage[]
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

const STORAGE_KEY = 'zd-locale'

function detectLocale(supported: string[]): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && supported.includes(stored)) return stored
  } catch {
    // localStorage unavailable
  }
  return supported[0] ?? 'en'
}

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

  const [locale, setLocaleState] = useState<Locale>(() => detectLocale(supportedCodes))
  const resolvedLocale = supportedCodes.includes(locale) ? locale : (supportedCodes[0] ?? 'en')

  useEffect(() => {
    document.documentElement.lang = resolvedLocale
  }, [resolvedLocale])

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (!supportedCodes.includes(newLocale)) return
      setLocaleState(newLocale)
      try {
        localStorage.setItem(STORAGE_KEY, newLocale)
      } catch {
        // localStorage unavailable
      }
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