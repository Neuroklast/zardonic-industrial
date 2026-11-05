import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('admin password recovery wiring', () => {
  it('exposes an unauthenticated reset request from the login form', () => {
    const login = read('app/admin/login/_components/LoginForm.tsx')
    const proxy = read('proxy.ts')
    expect(login).toContain('/admin/forgot-password')
    expect(proxy).toContain("pathname.startsWith('/admin/forgot-password')")
    expect(proxy).toContain("pathname.startsWith('/admin/reset-password')")
  })

  it('requests recovery without revealing whether the account exists', () => {
    const request = read('app/admin/forgot-password/submit/route.ts')
    expect(request).toContain('resetPasswordForEmail(email')
    expect(request).toContain("namespace: 'password-recovery'")
    expect(request).toContain("baseUrl.searchParams.set('sent', '1')")
    expect(request).toContain("redirectTo: new URL('/admin/reset-password', request.url)")
    expect(request).not.toContain('service_role')
  })

  it('requires a deliberate POST to verify the one-time recovery token', () => {
    const page = read('app/auth/confirm/page.tsx')
    const verify = read('app/auth/confirm/verify/route.ts')
    expect(page).toContain('method="POST"')
    expect(verify).toContain("type: 'recovery'")
    expect(verify).toContain('verifyOtp')
    expect(verify).toContain('response.cookies.set')
    expect(verify).toContain("new URL('/admin/reset-password', request.url)")
  })

  it('authenticates the recovery session before allowing a password update', () => {
    const update = read('app/admin/reset-password/submit/route.ts')
    expect(update).toContain('supabase.auth.getUser()')
    expect(update).toContain('if (!user)')
    expect(update).toContain('supabase.auth.updateUser({ password })')
    expect(update).toContain('password.length < 12')
    expect(update).toContain('password !== confirm')
    expect(update).toContain('supabase.auth.signOut()')
    expect(update).toContain("new URL('/admin/login?notice=password-updated'")
  })
})
