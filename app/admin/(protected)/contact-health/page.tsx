import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { RefreshButton } from '@/app/admin/(protected)/health/RefreshButton'
import { createActionClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { decryptSecret, isSecretsEncryptionConfigured } from '@/lib/secrets-encryption'
import { getApiSecret } from '@/lib/api-secrets'
import { getConfiguredContactSender } from '@/lib/contact-sender'

export const dynamic = 'force-dynamic'

interface StatusRow {
  label: string
  ok: boolean
  detail: string
}


async function diagnostics(): Promise<StatusRow[]> {
  const rows: StatusRow[] = []
  const sender = getConfiguredContactSender()
  const recipient = process.env.CONTACT_EMAIL?.trim() || 'contact@zardonic.com'

  rows.push({ label: 'Recipient', ok: !!recipient, detail: `Contact recipient: ${recipient}` })
  rows.push({ label: 'Sender', ok: /^[^@\s]+@zardonic\.net$/i.test(sender), detail: `Sender: ${sender} (zardonic.net only)` })

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('api_secrets')
      .select('encrypted_value').eq('key', 'resend_api_key').maybeSingle()
    if (error) {
      rows.push({ label: 'Stored API key', ok: false, detail: `Cannot read api_secrets: ${error.code || 'database error'}` })
    } else if (data?.encrypted_value) {
      if (!isSecretsEncryptionConfigured()) {
        rows.push({ label: 'Stored API key', ok: false, detail: 'Resend key exists in Supabase but SECRETS_ENCRYPTION_KEY / OAUTH_ENCRYPTION_KEY is not set on this deployment.' })
      } else {
        try {
          const decrypted = decryptSecret(data.encrypted_value)
          rows.push({ label: 'Stored API key', ok: decrypted.startsWith('re_'), detail: decrypted.startsWith('re_') ? 'Stored API key can be decrypted.' : 'Decrypted key has an unexpected format.' })
        } catch {
          rows.push({ label: 'Stored API key', ok: false, detail: 'Stored Resend key cannot be decrypted by this deployment. Check its encryption key.' })
        }
      }
    } else {
      rows.push({ label: 'Stored API key', ok: !!process.env.RESEND_API_KEY, detail: process.env.RESEND_API_KEY ? 'Using RESEND_API_KEY from environment.' : 'No Resend key stored or configured.' })
    }
  } catch {
    rows.push({ label: 'Stored API key', ok: false, detail: 'Cannot inspect Supabase credentials. Check service-role configuration.' })
  }

  const key = await getApiSecret('resend_api_key').catch(() => null)
  if (!key) {
    rows.push({ label: 'Resend connectivity', ok: false, detail: 'No usable API key. Check encryption key or RESEND_API_KEY.' })
    return rows
  }
  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6500),
      cache: 'no-store',
    })
    if (!response.ok) {
      const errorPayload: unknown = await response.json().catch(() => null)
      const errorName = errorPayload && typeof errorPayload === 'object' && 'name' in errorPayload
        ? String((errorPayload as { name: unknown }).name) : ''
      const sendOnly = errorName === 'restricted_api_key'
      rows.push({
        label: 'Resend connectivity',
        ok: sendOnly,
        detail: sendOnly
          ? 'Sending-only API key: domain inspection is restricted. This does not prove delivery or domain verification.'
          : response.status === 401
            ? 'HTTP 401: The Resend API key is invalid or expired.'
            : response.status === 403
              ? 'HTTP 403: Resend denied the domain lookup. Check key permissions.'
              : `Resend domain lookup failed with HTTP ${response.status}.`,
      })
      if (sendOnly) rows.push({
        label: 'Sending domain',
        ok: false,
        detail: 'Cannot verify the sending domain with a sending-only API key. Check domain status manually in Resend.',
      })
      return rows
    }
    rows.push({ label: 'Resend connectivity', ok: true, detail: 'Resend accepted the API key for domain inspection.' })
    const payload: unknown = await response.json().catch(() => null)
    const domains = payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data?: unknown }).data : []
    const domainRows = Array.isArray(domains) ? domains : []
    const senderDomain = sender.split('@')[1]?.toLowerCase() ?? ''
    const match = domainRows.find((d) => d && typeof d === 'object'
      && typeof d.name === 'string' && senderDomain === d.name.toLowerCase())
    const status = match && typeof match.status === 'string' ? match.status : null
    rows.push({
      label: 'Sending domain',
      ok: status === 'verified',
      detail: !match
        ? 'zardonic.net is not registered as a sending domain in Resend. Add and verify it.'
        : `zardonic.net status: ${status || 'unknown'}. Domain must be verified before sending.`,
    })
  } catch {
    rows.push({ label: 'Resend connectivity', ok: false, detail: 'Resend API request failed or timed out.' })
  }
  return rows
}

interface ContactEventRow {
  id: string
  category: string
  code: string
  detail: string
  http_status: number | null
  created_at: string
}

export default async function ContactHealthPage() {
  const client = await createActionClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/admin/login')
  const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') redirect('/admin')

  const [checks, history] = await Promise.all([
    diagnostics(),
    (async () => {
      try {
        const { data, error } = await createAdminClient().from('contact_delivery_events')
          .select('id,category,code,detail,http_status,created_at')
          .order('created_at', { ascending: false }).limit(50)
        return { events: (data ?? []) as ContactEventRow[], error: error?.code ?? null }
      } catch {
        return { events: [] as ContactEventRow[], error: 'unavailable' }
      }
    })(),
  ])

  return (
    <div className="space-y-7">
      <AdminPageHeader
        title="Contact & Email Errors"
        description="Live diagnostics for contact form delivery. No visitor emails or messages are stored in this log."
        action={<RefreshButton />}
      />
      <p className="text-sm text-zinc-400">
        The footer mailing list opens Bandzoogle directly because its CSP blocks embedding.
        Contact messages are sent separately through Resend.
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/api-keys" className="rounded border border-zinc-700 px-3 py-2 text-zinc-200 hover:text-white">Manage API Keys</Link>
        <Link href="/admin/health" className="rounded border border-zinc-700 px-3 py-2 text-zinc-200 hover:text-white">Full API Health</Link>
      </div>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Delivery configuration</h2>
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr><th className="px-3 py-2 text-left">Check</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Detail / fix</th></tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check.label} className="border-t border-zinc-800">
                  <td className="px-3 py-3 text-zinc-200">{check.label}</td>
                  <td className={`px-3 py-3 font-semibold ${check.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{check.ok ? 'OK' : 'Check'}</td>
                  <td className="px-3 py-3 text-zinc-400">{check.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Recent contact form events</h2>
        {history.error ? (
          <p role="alert" className="border border-rose-800 bg-rose-950/20 p-3 text-sm text-rose-300">
            Error log unavailable ({history.error}). Apply the canonical supabase/schema.sql to create contact_delivery_events.
          </p>
        ) : history.events.length === 0 ? (
          <p className="text-sm text-zinc-400">No events recorded yet. New submissions will appear here.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-zinc-800">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-zinc-900 text-zinc-400">
                <tr><th className="px-3 py-2 text-left">Timestamp</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">HTTP</th><th className="px-3 py-2 text-left">Code</th><th className="px-3 py-2 text-left">Reason / action</th></tr>
              </thead>
              <tbody>
                {history.events.map((event) => (
                  <tr key={event.id} className="border-t border-zinc-800">
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-400">{new Date(event.created_at).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC</td>
                    <td className="px-3 py-3 text-zinc-200">{event.category}</td>
                    <td className="px-3 py-3 text-zinc-400">{event.http_status ?? '—'}</td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-300">{event.code}</td>
                    <td className="px-3 py-3 text-zinc-300">{event.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-zinc-500">Only operational metadata is recorded. Resend acceptance means the provider accepted the request, not that the recipient has received the email.</p>
      </section>
    </div>
  )
}
