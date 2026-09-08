import { describe, expect, it } from 'vitest'
import { sanitizeExternalHref, sanitizeHref } from '@/lib/sanitize-href'

describe('sanitizeExternalHref', () => {
  it('allows http and https', () => {
    expect(sanitizeExternalHref('https://example.com/x')).toBe('https://example.com/x')
    expect(sanitizeExternalHref('http://example.com/x')).toBe('http://example.com/x')
  })

  it('rejects javascript/data and relative paths', () => {
    expect(sanitizeExternalHref('javascript:alert(1)')).toBeUndefined()
    expect(sanitizeExternalHref('data:text/html,hi')).toBeUndefined()
    expect(sanitizeExternalHref('/legal-notice')).toBeUndefined()
    expect(sanitizeExternalHref('')).toBeUndefined()
    expect(sanitizeExternalHref(null)).toBeUndefined()
  })
})

describe('sanitizeHref', () => {
  it('allows same-origin legal paths', () => {
    expect(sanitizeHref('/legal-notice')).toBe('/legal-notice')
    expect(sanitizeHref('/privacy-policy')).toBe('/privacy-policy')
    expect(sanitizeHref('  /legal-notice  ')).toBe('/legal-notice')
  })

  it('allows http(s) when legal URLs are external', () => {
    expect(sanitizeHref('https://example.com/privacy')).toBe('https://example.com/privacy')
  })

  it('rejects protocol-relative, backslash, control chars, and script URLs', () => {
    expect(sanitizeHref('//evil.com')).toBeUndefined()
    expect(sanitizeHref('/\\evil.com')).toBeUndefined()
    expect(sanitizeHref('/legal-notice\u0000')).toBeUndefined()
    expect(sanitizeHref('javascript:alert(1)')).toBeUndefined()
    expect(sanitizeHref('data:text/html,hi')).toBeUndefined()
    expect(sanitizeHref('vbscript:msgbox(1)')).toBeUndefined()
    expect(sanitizeHref('')).toBeUndefined()
    expect(sanitizeHref(undefined)).toBeUndefined()
  })
})
