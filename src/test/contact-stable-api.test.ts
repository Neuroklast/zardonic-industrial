import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolveBrandMark } from '@/lib/social-brand-icons'

const root = resolve(import.meta.dirname, '../..')
const readSource = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('contact form regression guards', () => {
  it('submits both public forms through the stable API instead of a Server Action', () => {
    for (const path of [
      'app/_components/public/ContactSection.tsx',
      'components/overlays/ContactOverlayContent.tsx',
    ]) {
      const source = readSource(path)
      expect(source).toContain('sendContactForm')
      expect(source).not.toContain('submitContact')
    }
    expect(readSource('lib/contact-client.ts')).toContain("fetch('/api/contact'")
  })

  it('uses a consistent user-facing success message in both contact forms', () => {
    const client = readSource('lib/contact-client.ts')
    expect(client).toContain("export const CONTACT_SUBMISSION_SUCCESS_MESSAGE = 'Message accepted for delivery.'")
    for (const path of [
      'app/_components/public/ContactSection.tsx',
      'components/overlays/ContactOverlayContent.tsx',
    ]) {
      const source = readSource(path)
      expect(source).toContain('CONTACT_SUBMISSION_SUCCESS_MESSAGE')
      expect(source).not.toContain('Inbox delivery is not yet confirmed.')
      expect(source).not.toContain('Please note that inbox delivery is not guaranteed.')
    }
    expect(readSource('app/_components/public/ContactSection.tsx')).toContain('role="status"')
  })

  it('validates, rate-limits and delivers without reporting false success', () => {
    const route = readSource('app/api/contact/route.ts')
    expect(route).toContain('contactFormSchema.safeParse')
    expect(route).toContain('consumeRateLimitForRequest')
    expect(route).toContain('deliverContactMessage')
    expect(route).toContain('status: result.success ? 200 : 503')
    const delivery = readSource('lib/contact-delivery.ts')
    expect(delivery).toContain('if (!resendKey)')
    expect(delivery).toContain('if (!response.ok)')
    expect(delivery).not.toContain('message accepted (Resend not configured)')
  })

  it('handles missing platform names from legacy social rows safely', () => {
    expect(resolveBrandMark(undefined)).toBeNull()
    expect(resolveBrandMark(null)).toBeNull()
    expect(resolveBrandMark('')).toBeNull()
    expect(resolveBrandMark('Apple Music')).not.toBeNull()
    expect(readSource('app/page.tsx')).toContain("typeof link.platform === 'string'")
    expect(readSource('app/_components/public/SocialSection.tsx')).toContain("typeof platform === 'string'")
  })
})

describe('production integration hardening', () => {
  it('never attempts to iframe Bandzoogle, which sets frame-ancestors self', () => {
    const embed = readSource('app/_components/public/BandzoogleMailingListEmbed.tsx')
    expect(embed).not.toContain('<iframe')
    expect(embed).toContain('https://zardonic.bandzoogle.com/')
    expect(embed).toContain('target="_blank"')
  })

  it('supports a stable server-side fallback for missing optional rate limit salt', () => {
    const limiter = readSource('lib/rate-limit.ts')
    expect(limiter).toContain('createHmac')
    expect(limiter).toContain('process.env.SUPABASE_SERVICE_ROLE_KEY')
    expect(limiter).toContain('process.env.RATE_LIMIT_SALT')
  })

  it('handles missing keyboard event keys and malformed custom codes', () => {
    const listener = readSource('components/KonamiListener.tsx')
    expect(listener).toContain("typeof e.key === 'string'")
    expect(listener).toContain("typeof expected !== 'string'")
  })
})
