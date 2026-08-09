import { describe, it, expect } from 'vitest'
import {
  parseLegalConfig,
  parseFooterConfig,
  formatServiceAddress,
  getResponsibleName,
  getResponsibleAddress,
  getLegalCompleteness,
  isLegalConfigComplete,
} from '@/lib/legal-content'
import {
  buildLegalNoticeSections,
  buildPrivacyPolicySections,
  resolveLegalLocale,
} from '@/lib/legal-templates'

const sampleConfig = {
  operatorName: 'Zardonic Music',
  careOf: 'c/o Example Label',
  street: 'Musterstraße 1',
  zipCity: '10115 Berlin',
  country: 'Germany',
  phone: '+49 30 123456',
  email: 'legal@zardonic.com',
  vatId: 'DE123456789',
}

describe('parseLegalConfig', () => {
  it('parses structured operator fields', () => {
    const config = parseLegalConfig(sampleConfig)
    expect(config.operatorName).toBe('Zardonic Music')
    expect(config.street).toBe('Musterstraße 1')
    expect(config.country).toBe('Germany')
  })

  it('defaults country to Germany', () => {
    const config = parseLegalConfig({})
    expect(config.country).toBe('Germany')
  })
})

describe('parseFooterConfig', () => {
  it('uses new English URL keys', () => {
    const footer = parseFooterConfig({
      legalNoticeUrl: '/legal-notice',
      privacyPolicyUrl: '/privacy-policy',
    })
    expect(footer.legalNoticeUrl).toBe('/legal-notice')
    expect(footer.privacyPolicyUrl).toBe('/privacy-policy')
  })

  it('falls back to legacy impressum/privacy keys', () => {
    const footer = parseFooterConfig({ impressumUrl: '/impressum', privacyUrl: '/privacy' })
    expect(footer.legalNoticeUrl).toBe('/impressum')
    expect(footer.privacyPolicyUrl).toBe('/privacy')
  })
})

describe('formatServiceAddress', () => {
  it('formats ladungsfähige Anschrift from structured fields', () => {
    const address = formatServiceAddress(parseLegalConfig(sampleConfig))
    expect(address).toContain('Zardonic Music')
    expect(address).toContain('Musterstraße 1')
    expect(address).toContain('10115 Berlin')
    expect(address).toContain('Germany')
  })
})

describe('buildLegalNoticeSections', () => {
  it('injects operator name without custom override', () => {
    const sections = buildLegalNoticeSections(parseLegalConfig(sampleConfig))
    const operator = sections.find((s) => s.id === 'operator')
    expect(operator?.paragraphs.join(' ')).toContain('Zardonic Music')
    expect(operator?.paragraphs.join(' ')).toContain('Musterstraße 1')
  })

  it('uses custom override when set', () => {
    const sections = buildLegalNoticeSections(
      parseLegalConfig({ ...sampleConfig, legalNoticeCustom: 'Custom legal text' }),
    )
    expect(sections).toHaveLength(1)
    expect(sections[0].paragraphs[0]).toBe('Custom legal text')
  })
})

describe('buildPrivacyPolicySections', () => {
  it('includes controller name in template', () => {
    const sections = buildPrivacyPolicySections(parseLegalConfig(sampleConfig))
    const overview = sections.find((s) => s.id === 'overview')
    expect(overview?.paragraphs.join(' ')).toContain('Zardonic Music')
  })

  it('uses privacy custom override when set', () => {
    const sections = buildPrivacyPolicySections(
      parseLegalConfig({ ...sampleConfig, privacyPolicyCustom: 'My custom policy' }),
    )
    expect(sections).toHaveLength(1)
    expect(sections[0].paragraphs[0]).toBe('My custom policy')
  })

  it('covers newsletter double opt-in, TDDDG, self-hosted fonts, analytics retention', () => {
    const sections = buildPrivacyPolicySections(parseLegalConfig(sampleConfig))
    const body = sections.map((s) => s.paragraphs.join(' ')).join(' ')
    expect(body).toMatch(/TDDDG|Telecommunications Digital Services/)
    expect(body).toContain('double opt-in')
    expect(body).toMatch(/unsubscribe/i)
    expect(sections.some((s) => s.id === 'news')).toBe(true)
    expect(body).toMatch(/self-hosted/i)
    expect(body).toMatch(/90 days/)
    expect(body).toMatch(/rate-limited/i)
  })

  it('builds German privacy sections', () => {
    const sections = buildPrivacyPolicySections(parseLegalConfig(sampleConfig), 'de')
    const body = sections.map((s) => s.paragraphs.join(' ')).join(' ')
    expect(body).toMatch(/Datenschutz|personenbezogenen/)
    expect(body).toMatch(/self-hosted|next\/font|Orbitron/)
    expect(sections.find((s) => s.id === 'rights')?.title).toMatch(/Rechte/)
  })
})

describe('legal locale + completeness', () => {
  it('resolves de/en locales', () => {
    expect(resolveLegalLocale('de')).toBe('de')
    expect(resolveLegalLocale('de-DE')).toBe('de')
    expect(resolveLegalLocale('en')).toBe('en')
    expect(resolveLegalLocale('ja')).toBe('en')
  })

  it('builds German legal notice with DDG heading', () => {
    const sections = buildLegalNoticeSections(parseLegalConfig(sampleConfig), 'de')
    expect(sections.find((s) => s.id === 'operator')?.title).toMatch(/§ 5 DDG/)
    expect(sections.find((s) => s.id === 'operator')?.paragraphs.join(' ')).toContain('Zardonic Music')
  })

  it('detects incomplete legal config', () => {
    expect(isLegalConfigComplete(parseLegalConfig({}))).toBe(false)
    expect(getLegalCompleteness(parseLegalConfig({})).missing).toContain('operatorName')
    expect(isLegalConfigComplete(parseLegalConfig(sampleConfig))).toBe(true)
  })
})

describe('responsible person defaults', () => {
  it('defaults responsible name to operator name', () => {
    const config = parseLegalConfig(sampleConfig)
    expect(getResponsibleName(config)).toBe('Zardonic Music')
  })

  it('defaults responsible address to formatted service address', () => {
    const config = parseLegalConfig(sampleConfig)
    expect(getResponsibleAddress(config)).toContain('Musterstraße 1')
  })
})