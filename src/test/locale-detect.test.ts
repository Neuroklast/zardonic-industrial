import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  COUNTRY_TO_LOCALE,
  detectLocaleSync,
  localeFromBrowser,
  localeFromCountry,
  matchSupportedLocale,
  NAV_LABEL_I18N_KEYS,
} from '@/lib/locale-detect'

describe('locale-detect', () => {
  const supported = ['en', 'de', 'ru', 'it', 'es', 'pt', 'ja', 'ko']

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps major countries to locales', () => {
    expect(localeFromCountry('DE', supported)).toBe('de')
    expect(localeFromCountry('BR', supported)).toBe('pt')
    expect(localeFromCountry('JP', supported)).toBe('ja')
    expect(localeFromCountry('US', supported)).toBeNull()
  })

  it('matches BCP-47 tags to supported base codes', () => {
    expect(matchSupportedLocale('de-AT', supported)).toBe('de')
    expect(matchSupportedLocale('pt-BR', supported)).toBe('pt')
    expect(matchSupportedLocale('fr-FR', supported)).toBeNull()
  })

  it('prefers localStorage over browser', () => {
    localStorage.setItem('zd-locale', 'ja')
    vi.stubGlobal('navigator', { language: 'de-DE', languages: ['de-DE'] })
    expect(detectLocaleSync(supported)).toBe('ja')
  })

  it('uses browser language when no storage', () => {
    vi.stubGlobal('navigator', { language: 'es-MX', languages: ['es-MX', 'en'] })
    expect(detectLocaleSync(supported)).toBe('es')
  })

  it('falls back to English when nothing matches', () => {
    vi.stubGlobal('navigator', { language: 'fr-FR', languages: ['fr-FR'] })
    expect(detectLocaleSync(supported)).toBe('en')
  })

  it('has i18n keys for every public nav section', () => {
    const sections = [
      'bio',
      'credits',
      'gallery',
      'music-highlights',
      'releases',
      'merchandise',
      'soundpacks',
      'gigs',
      'news',
      'newsletter',
      'contact',
    ]
    for (const id of sections) {
      expect(NAV_LABEL_I18N_KEYS[id]).toBeTruthy()
    }
  })

  it('country table only maps to known built-in codes', () => {
    for (const code of Object.values(COUNTRY_TO_LOCALE)) {
      expect(supported).toContain(code)
    }
  })

  it('localeFromBrowser returns null without navigator match', () => {
    vi.stubGlobal('navigator', { language: 'sv-SE', languages: ['sv-SE'] })
    expect(localeFromBrowser(supported)).toBeNull()
  })
})
