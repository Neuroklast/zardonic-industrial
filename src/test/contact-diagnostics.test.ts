import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { explainResendError } from '@/lib/contact-diagnostics'

const root = resolve(import.meta.dirname, '../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('contact email error reporting', () => {
  it('classifies upstream failures without saving provider messages or private user data', () => {
    expect(explainResendError(401, { name: 'validation_error', message: 'secret api key re_secret' }))
      .toMatchObject({ code: 'resend_401_validation_error', detail: expect.stringContaining('API key') })
    expect(explainResendError(403, { name: 'validation_error', message: 'Domain zardonic.com is not verified' }).detail)
      .toContain('sender domain')
    expect(explainResendError(429, null).detail).toContain('rate limit')
    const sensitive = 'Someone private@example.com wrote a private message'
    expect(explainResendError(422, { message: sensitive }).detail).not.toContain(sensitive)
  })

  it('persists metadata only and logs upstream and internal delivery errors', () => {
    const diagnostics = read('lib/contact-diagnostics.ts')
    const delivery = read('lib/contact-delivery.ts')
    const route = read('app/api/contact/route.ts')
    expect(diagnostics).toContain("from('contact_delivery_events').insert")
    expect(diagnostics).not.toContain('event.email')
    expect(diagnostics).not.toContain('event.message')
    expect(delivery).toContain('explainResendError')
    expect(delivery).toContain('resend_key_missing')
    expect(delivery).toContain('resend_accepted')
    expect(route).toContain('rate_limit_unavailable')
  })

  it('exposes a role-checked admin page from the existing navigation', () => {
    const page = read('app/admin/(protected)/contact-health/page.tsx')
    const nav = read('app/admin/_config/nav-groups.ts')
    expect(nav).toContain("href: '/admin/contact-health'")
    expect(page).toContain("profile?.role !== 'admin'")
    expect(page).toContain("from('contact_delivery_events')")
    expect(page).toContain('SECRETS_ENCRYPTION_KEY')
    expect(page).toContain('Sending domain')
  })

  it('does not treat Resend 401 unauthorized as success', () => {
    const health = read('app/admin/(protected)/health/page.tsx')
    expect(health).toContain('const ok = res.ok')
    expect(health).not.toContain('res.status === 200 || res.status === 401')
  })

  it('keeps diagnostics locked down and managed by the one canonical schema', () => {
    const sql = read('supabase/schema.sql')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.contact_delivery_events')
    expect(sql).toContain('ALTER TABLE public.contact_delivery_events ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('REVOKE ALL ON public.contact_delivery_events FROM PUBLIC, anon, authenticated')
    expect(sql).toContain('GRANT SELECT, INSERT, DELETE ON public.contact_delivery_events TO service_role')
  })
})
