import { createContext, useContext } from 'react'

export type Locale = 'en' | 'de'

export interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export const useLocale = (): LocaleContextValue => {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider')
  return ctx
}
