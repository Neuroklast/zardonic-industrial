import { describe, expect, it } from 'vitest'
import { newsletterSubscribeSchema, newsletterTokenSchema } from '@/lib/newsletter-schema'
import { generateNewsletterToken, isConfirmationExpired, newsletterConfirmationExpiry } from '@/lib/newsletter-tokens'
import { getNewsletterStatus } from '@/lib/newsletter-status'
import { buildConfirmUrl, buildUnsubscribeUrl } from '@/lib/newsletter-email'

describe('newsletterSubscribeSchema', () => {
  it('accepts valid subscribe input', () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: 'fan@example.com',
      consent_given: 'true',
      _hp: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('fan@example.com')
    }
  })

  it('normalizes email to lowercase', () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: 'Fan@Example.COM',
      consent_given: 'true',
      _hp: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('fan@example.com')
    }
  })

  it('rejects missing consent', () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: 'fan@example.com',
      consent_given: 'false',
    })
    expect(result.success).toBe(false)
  })

  it('rejects honeypot fill', () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: 'fan@example.com',
      consent_given: 'true',
      _hp: 'bot',
    })
    expect(result.success).toBe(false)
  })
})

describe('newsletterTokenSchema', () => {
  it('accepts hex tokens', () => {
    const token = generateNewsletterToken()
    expect(newsletterTokenSchema.safeParse(token).success).toBe(true)
  })

  it('rejects invalid tokens', () => {
    expect(newsletterTokenSchema.safeParse('short').success).toBe(false)
    expect(newsletterTokenSchema.safeParse('not-hex-characters-zzzzzzzzzzzzzzzz').success).toBe(false)
  })
})

describe('newsletter tokens', () => {
  it('generates unique 64-char hex tokens', () => {
    const a = generateNewsletterToken()
    const b = generateNewsletterToken()
    expect(a).toHaveLength(64)
    expect(b).toHaveLength(64)
    expect(a).not.toBe(b)
  })

  it('detects expired confirmation', () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(isConfirmationExpired(past)).toBe(true)
    expect(isConfirmationExpired(newsletterConfirmationExpiry())).toBe(false)
    expect(isConfirmationExpired(null)).toBe(true)
  })
})

describe('getNewsletterStatus', () => {
  it('returns pending when not confirmed', () => {
    expect(getNewsletterStatus({ confirmed_at: null, unsubscribed_at: null })).toBe('pending')
  })

  it('returns active when confirmed', () => {
    expect(getNewsletterStatus({ confirmed_at: new Date().toISOString(), unsubscribed_at: null })).toBe('active')
  })

  it('returns unsubscribed when unsubscribed_at is set', () => {
    expect(
      getNewsletterStatus({
        confirmed_at: new Date().toISOString(),
        unsubscribed_at: new Date().toISOString(),
      }),
    ).toBe('unsubscribed')
  })
})

describe('newsletter email URLs', () => {
  it('builds confirm and unsubscribe URLs', () => {
    const token = 'abc123'
    expect(buildConfirmUrl(token)).toContain('/newsletter/confirm?token=abc123')
    expect(buildUnsubscribeUrl(token)).toContain('/newsletter/unsubscribe?token=abc123')
  })
})