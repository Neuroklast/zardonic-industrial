import { describe, expect, it, afterEach } from 'vitest'
import { chooseContactSender, getConfiguredContactSender } from '@/lib/contact-sender'

const previousFrom = process.env.CONTACT_FROM_EMAIL
const previousEmailFrom = process.env.EMAIL_FROM

afterEach(() => {
  if (previousFrom === undefined) delete process.env.CONTACT_FROM_EMAIL
  else process.env.CONTACT_FROM_EMAIL = previousFrom
  if (previousEmailFrom === undefined) delete process.env.EMAIL_FROM
  else process.env.EMAIL_FROM = previousEmailFrom
})

const verifiedNet = {
  available: true,
  domains: [{ name: 'zardonic.net', status: 'verified', sendingEnabled: true }],
}

describe('Zardonic contact sender domain enforcement', () => {
  it('always defaults to zardonic.net even when legacy env vars specify .com', () => {
    process.env.CONTACT_FROM_EMAIL = 'no-reply@zardonic.com'
    process.env.EMAIL_FROM = 'team@other.net'
    expect(getConfiguredContactSender()).toBe('no-reply@zardonic.net')
    process.env.CONTACT_FROM_EMAIL = 'contact@zardonic.net'
    expect(getConfiguredContactSender()).toBe('contact@zardonic.net')
  })

  it('never selects zardonic.com, a subdomain or another verified domain', () => {
    const result = chooseContactSender('no-reply@zardonic.com', {
      available: true,
      domains: [
        { name: 'zardonic.com', status: 'verified', sendingEnabled: true },
        { name: 'another.net', status: 'verified', sendingEnabled: true },
        { name: 'mail.zardonic.net', status: 'verified', sendingEnabled: true },
      ],
    })
    expect(result.from).toBeUndefined()
    expect(result.code).toBe('zardonic_net_unverified')
    expect(result.error).toContain('zardonic.net')
  })

  it('uses the exact verified zardonic.net domain for sending', () => {
    expect(chooseContactSender('no-reply@zardonic.com', verifiedNet))
      .toMatchObject({ from: 'no-reply@zardonic.net', verified: true })
    expect(chooseContactSender('management@zardonic.net', verifiedNet))
      .toMatchObject({ from: 'management@zardonic.net', verified: true })
  })

  it('does not send if the zardonic.net domain is unverified or sending disabled', () => {
    for (const domain of [
      { name: 'zardonic.net', status: 'pending', sendingEnabled: true },
      { name: 'zardonic.net', status: 'verified', sendingEnabled: false },
    ]) {
      expect(chooseContactSender('no-reply@zardonic.net', {
        available: true,
        domains: [domain],
      }).from).toBeUndefined()
    }
  })

  it('keeps the required .net address for send-only Resend keys', () => {
    expect(chooseContactSender('no-reply@zardonic.com', { available: false, domains: [] }))
      .toMatchObject({ from: 'no-reply@zardonic.net', verified: false })
  })
})
