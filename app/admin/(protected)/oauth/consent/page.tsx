import { createActionClient } from '@/lib/supabaseServer'
import { getActiveMcpClient } from '@/lib/mcp/client-registry'
import { decideMcpOAuth } from '@/app/admin/_actions/mcpOAuth'
import { redirect } from 'next/navigation'
import { isValidOAuthAuthorizationId } from '@/lib/mcp/authorization-id'

export default async function McpOAuthConsent({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string }>
}) {
  const id = (await searchParams).authorization_id
  if (!isValidOAuthAuthorizationId(id)) return <p>Invalid authorization request.</p>
  const supabase = await createActionClient()
  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id)
  if (error || !data) return <p>OAuth authorization request unavailable.</p>
  if (!('authorization_id' in data)) {
    // Supabase may return a redirect when this client was previously authorized.
    if (data.redirect_url && new URL(data.redirect_url).protocol === 'https:') redirect(data.redirect_url)
    return <p>Unable to resume the authorization request.</p>
  }
  const client = data.client as { id?: string; client_id?: string; name?: string }
  const clientId = client.id ?? client.client_id
  if (!clientId || !(await getActiveMcpClient(clientId))) {
    return <p>This OAuth client is not permitted to access ZARDONIC content.</p>
  }
  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (assuranceError) return <p>Cannot verify MFA assurance. Authorization was not granted.</p>
  if (assurance?.currentLevel !== 'aal2') {
    const returnTo = '/admin/oauth/consent?authorization_id=' + encodeURIComponent(id)
    redirect('/admin/mfa?returnTo=' + encodeURIComponent(returnTo))
  }

  return (
    <main className="mx-auto w-full max-w-xl space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-6">
      <h1 className="text-xl font-bold">Connect ZARDONIC Content</h1>
      <p className="text-sm text-zinc-300">
        {client.name ?? 'An external application'} is requesting access to editorial content.
        It may read news, shows, discography and other allowlisted content, and submit
        changes for manual review. It cannot directly publish, delete, process payments,
        access passwords or modify legal documents.
      </p>
      <p className="text-sm text-zinc-400">Requested scopes: {data.scope || 'default'}</p>
      <p className="break-all text-xs text-zinc-500">Callback: {data.redirect_uri}</p>
      <p className="text-sm text-zinc-400">An administrator account with active MFA is required.</p>
      <form action={decideMcpOAuth} className="flex flex-wrap gap-3">
        <input type="hidden" name="authorization_id" value={id} />
        <button name="decision" value="approve" type="submit" className="rounded bg-zinc-200 px-4 py-2 text-sm font-semibold text-black">Authorize</button>
        <button name="decision" value="deny" type="submit" className="rounded border border-zinc-600 px-4 py-2 text-sm">Deny</button>
      </form>
    </main>
  )
}
