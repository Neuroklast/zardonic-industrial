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
