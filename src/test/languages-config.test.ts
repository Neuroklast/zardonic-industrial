import { describe, it, expect } from 'vitest'
import {
  isValidLocaleCode,
  parseLanguagesConfig,
  getEnabledLocaleCodes,
} from '@/lib/languages-config'
import { BUILTIN_LOCALES } from '@/lib/i18n'

describe('isValidLocaleCode', () => {
  it('accepts ISO 639-1 and regional variants', () => {
    expect(isValidLocaleCode('en')).toBe(true)
    expect(isValidLocaleCode('de')).toBe(true)
    expect(isValidLocaleCode('pt-br')).toBe(true)
  })

  it('rejects invalid codes', () => {
    expect(isValidLocaleCode('')).toBe(false)
    expect(isValidLocaleCode('english')).toBe(false)
    expect(isValidLocaleCode('EN')).toBe(false)
    expect(isValidLocaleCode('e')).toBe(false)
  })
})

describe('parseLanguagesConfig', () => {
  it('falls back to built-in locales when input is missing', () => {
    expect(parseLanguagesConfig(null)).toEqual(BUILTIN_LOCALES)
    expect(parseLanguagesConfig([])).toEqual(BUILTIN_LOCALES)
  })

  it('parses configured languages and deduplicates codes', () => {
    expect(
      parseLanguagesConfig([
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français' },
        { code: 'FR', label: 'Duplicate' },
        { code: 'invalid', label: 'Nope' },
      ]),
    ).toEqual([
      { code: 'en', label: 'English', flag: '' },
      { code: 'fr', label: 'Français', flag: '' },
    ])
  })

  it('uses built-in labels when label is omitted', () => {
    const parsed = parseLanguagesConfig([{ code: 'de' }])
    expect(parsed).toEqual([{ code: 'de', label: 'Deutsch', flag: '' }])
  })
})

describe('getEnabledLocaleCodes', () => {
  it('returns locale codes in order', () => {
    expect(
      getEnabledLocaleCodes([
        { code: 'en', label: 'English', flag: '' },
        { code: 'fr', label: 'Français', flag: '' },
      ]),
    ).toEqual(['en', 'fr'])
  })
})