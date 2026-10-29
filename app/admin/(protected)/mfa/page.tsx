import { createActionClient } from '@/lib/supabaseServer'
import { safeAdminRedirect } from '@/lib/admin-login-redirect'
import AdminMfaPanel from './AdminMfaPanel'

export const dynamic = 'force-dynamic'

export default async function AdminMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const params = await searchParams
  const raw = params.returnTo ?? '/admin/security'
  const sanitized = safeAdminRedirect(raw, process.env.NEXT_PUBLIC_SITE_URL || 'https://zardonic-website.vercel.app')
  const returnTo = sanitized.startsWith('/admin/') && !sanitized.startsWith('/admin/login')
    ? sanitized
    : '/admin/security'

  // The existing admin proxy and protected layout enforce current admin role.
  const supabase = await createActionClient()
  const [{ data: assurance }, { data: factors }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ])
  const verifiedFactorId = factors?.totp?.[0]?.id ?? null
  return (
    <main className="mx-auto max-w-xl py-6">
      <AdminMfaPanel
        verifiedFactorId={verifiedFactorId}
        currentLevel={assurance?.currentLevel ?? 'aal1'}
        returnTo={returnTo}
      />
    </main>
  )
}
