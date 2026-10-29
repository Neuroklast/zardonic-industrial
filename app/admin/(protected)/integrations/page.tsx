import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/app/admin/_actions/auth'
import { registerMcpClient, setMcpClientEnabled, deleteMcpClient, verifyMcpClientMfa } from '@/app/admin/_actions/mcpIntegrations'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { CopyMcpAddress } from './CopyMcpAddress'
import { RemoveMcpClientButton } from './RemoveMcpClientButton'
import { type McpRegisteredClient } from '@/lib/mcp/client-registry'

async function addClient(form: FormData) {
  'use server'
  const result = await registerMcpClient(form)
  redirect('/admin/integrations?status=' + (result.success ? result.outcome : result.error))
}
async function toggleClient(form: FormData) {
  'use server'
  const result = await setMcpClientEnabled(String(form.get('client_id') || ''), form.get('enabled') === 'true')
  redirect('/admin/integrations?status=' + (result.success ? 'ok' : 'failed'))
}

async function removeClient(form: FormData) {
  'use server'
  const result = await deleteMcpClient(String(form.get('client_id') || ''))
  redirect('/admin/integrations?status=' + (result.success ? result.outcome : result.error))
}

async function confirmMfaGrant(form: FormData) {
  'use server'
  const result = await verifyMcpClientMfa(String(form.get('client_id') ?? ''))
  redirect('/admin/integrations?status=' + (result.success ? result.outcome : result.error))
}

export const dynamic = 'force-dynamic'

export default async function IntegrationsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin()
  const { data, error } = await createAdminClient().from('mcp_oauth_clients')
    .select('client_id, provider, display_name, enabled').order('created_at', { ascending: false }).limit(100)
  const clients = (data ?? []) as McpRegisteredClient[]
  const { status } = await searchParams
  return <main className="mx-auto max-w-5xl space-y-6 px-4 pb-12">
    <header>
      <h1 className="text-2xl font-bold text-white">AI Integrations</h1>
      <p className="mt-2 text-sm text-zinc-400">Manage OAuth access to ZARDONIC editorial tools. All content edits still require separate admin approval.</p>
    </header>
    {status === 'mfa' && <p role="alert" className="text-red-300">Administrator MFA verification is required. Verify your session, then try again.</p>}
    {status === 'invalid' && <p role="alert" className="text-red-300">Invalid client ID, display name, or provider.</p>}
    {status === 'database' && <p role="alert" className="text-red-300">Database operation failed. Verify that the integration registry is available.</p>}
    {status === 'not_found' && <p role="alert" className="text-red-300">This OAuth client is not registered in ZARDONIC.</p>}
    {status === 'unchanged' && <p role="status" className="text-zinc-300">Client is already registered and authorized. Nothing else needs to be added here.</p>}
    {status === 'added' && <p role="status" className="text-zinc-300">Client added and authorized.</p>}
    {status === 'updated' && <p role="status" className="text-zinc-300">Client details and access updated.</p>}
    {status === 'deleted' && <p role="status" className="text-zinc-300">Client removed from ZARDONIC. Its MCP access is now blocked.</p>}
    {status === 'verified' && <p role="status" className="text-zinc-300">MFA access confirmed for this OAuth client. Retry connecting the existing ChatGPT plugin; no new app is needed.</p>}
    <section className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <h2 className="font-semibold">Your secure MCP address</h2>
      <CopyMcpAddress value={new URL('/api/mcp', process.env.NEXT_PUBLIC_SITE_URL || 'https://zardonic-website.vercel.app').toString()} />
      <p className="text-sm text-zinc-400">First register the client and its exact callback in Supabase Authentication → OAuth Apps.
      OAuth signs you in with your existing admin account; it cannot automatically install a connector in every AI application.</p>
      <Link href="/admin/mfa" className="text-sm text-red-300 underline">Set up or verify your authenticator</Link>
    </section>
    <section className="grid gap-3 sm:grid-cols-2">
      <article className="space-y-2 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <h2 className="font-semibold">Claude</h2>
        <p className="text-sm text-zinc-400">Customize → Connectors → Add custom connector.
          Enter the MCP URL once and complete the ZARDONIC OAuth login.</p>
        <a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp"
          rel="noopener noreferrer" target="_blank" className="text-sm text-red-300 underline">Claude setup guide</a>
      </article>
      <article className="space-y-2 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <h2 className="font-semibold">OpenCode</h2>
        <p className="text-sm text-zinc-400">Configure this remote MCP endpoint and authorize in the browser.
          OpenCode supports OAuth for remote servers.</p>
        <a href="https://opencode.ai/docs/en/mcp-servers/"
          rel="noopener noreferrer" target="_blank" className="text-sm text-red-300 underline">OpenCode setup guide</a>
      </article>
    </section>
    <section className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <h2 className="font-semibold">Register or update an OAuth client</h2>
      <form action={addClient} className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">Provider
          <select name="provider" className="block w-full rounded border border-zinc-600 bg-zinc-950 p-3">
            <option value="claude">Claude</option><option value="opencode">OpenCode</option>
            <option value="gemini">Gemini CLI</option><option value="cursor">Cursor</option><option value="other">Other</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">Display name
          <input name="display_name" required minLength={2} maxLength={80} placeholder="ZARDONIC Claude" className="block w-full rounded border border-zinc-600 bg-zinc-950 p-3" />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">Supabase client ID (not secret)
          <input name="client_id" autoComplete="off" required minLength={8} maxLength={180} className="block w-full rounded border border-zinc-600 bg-zinc-950 p-3 font-mono text-sm" />
        </label>
        <button className="w-fit rounded bg-red-950 px-4 py-3 text-sm text-red-100">Authorize client</button>
      </form>
    </section>
    <section className="space-y-3">
      <h2 className="font-semibold">Client access</h2>
      {error && <p role="alert" className="text-red-300">Could not load allowlist. No client is implicitly authorized.</p>}
      {clients.length === 0 && <p className="text-sm text-zinc-400">No OAuth clients authorized.</p>}
      {clients.map(client => <article key={client.client_id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-zinc-700 bg-zinc-900 p-4">
        <div className="min-w-0">
          <strong>{client.display_name}</strong>
          <p className="text-xs text-zinc-400">{client.provider} · {client.enabled ? 'Allowed' : 'Blocked'}</p>
          <p className="break-all font-mono text-xs text-zinc-500">{client.client_id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {client.enabled && <form action={confirmMfaGrant}>
            <input name="client_id" type="hidden" value={client.client_id} />
            <button className="rounded border border-zinc-500 px-3 py-2 text-sm">Confirm MFA for OAuth</button>
          </form>}
          <form action={toggleClient}>
            <input type="hidden" name="client_id" value={client.client_id} />
            <input type="hidden" name="enabled" value={String(!client.enabled)} />
            <button className="rounded border border-zinc-600 px-4 py-2 text-sm">{client.enabled ? 'Block now' : 'Re-enable'}</button>
          </form>
          <RemoveMcpClientButton clientId={client.client_id} name={client.display_name} removeAction={removeClient} />
        </div>
      </article>)}
      <p className="text-xs text-zinc-500">Blocking or deleting removes MCP access on the next request, including existing access tokens. Deletion here only removes ZARDONIC's permission entry: revoke or delete the OAuth application and refresh tokens separately in Supabase. Pending content proposals remain in the review queue.</p>
    </section>
  </main>
}
