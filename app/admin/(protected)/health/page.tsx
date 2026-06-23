import { createClient } from '@/lib/supabaseServer'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { RefreshButton } from './RefreshButton'

interface CheckResult {
  name: string
  ok: boolean
  ms: number
  detail?: string
}

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('site_config').select('key').limit(1)
    return { name: 'Supabase DB', ok: !error, ms: Date.now() - start, detail: error?.message }
  } catch (e) {
    return { name: 'Supabase DB', ok: false, ms: Date.now() - start, detail: e instanceof Error ? e.message : 'Unknown error' }
  }
}

async function checkR2(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const bucket = process.env.R2_BUCKET_MEDIA

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      return { name: 'Cloudflare R2', ok: false, ms: Date.now() - start, detail: 'Missing R2 environment variables' }
    }

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })

    await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }))
    return { name: 'Cloudflare R2', ok: true, ms: Date.now() - start }
  } catch (e) {
    return { name: 'Cloudflare R2', ok: false, ms: Date.now() - start, detail: e instanceof Error ? e.message : 'Unknown error' }
  }
}

async function checkResend(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const key = process.env.RESEND_API_KEY
    if (!key) {
      return { name: 'Resend Email API', ok: false, ms: Date.now() - start, detail: 'RESEND_API_KEY not set' }
    }
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: 'Bearer ' + key },
      signal: AbortSignal.timeout(5000),
    })
    // 200 = OK, 401 = key present but no domain = still reachable
    const ok = res.status === 200 || res.status === 401
    return { name: 'Resend Email API', ok, ms: Date.now() - start, detail: ok ? undefined : `HTTP ${res.status}` }
  } catch (e) {
    return { name: 'Resend Email API', ok: false, ms: Date.now() - start, detail: e instanceof Error ? e.message : 'Network error' }
  }
}

async function checkItunes(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await fetch('https://itunes.apple.com/search?term=test&limit=1', {
      signal: AbortSignal.timeout(5000),
    })
    return { name: 'iTunes Search API', ok: res.ok, ms: Date.now() - start, detail: res.ok ? undefined : `HTTP ${res.status}` }
  } catch (e) {
    return { name: 'iTunes Search API', ok: false, ms: Date.now() - start, detail: e instanceof Error ? e.message : 'Network error' }
  }
}

const ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_MEDIA',
  'R2_PUBLIC_HOST',
  'RESEND_API_KEY',
  'CONTACT_EMAIL',
]

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        ok ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-red-900/40 text-red-400 border border-red-800',
      ].join(' ')}
    >
      {ok ? '✓ OK' : '✗ Fail'}
    </span>
  )
}

export default async function HealthPage() {
  const [supabaseResult, r2Result, resendResult, itunesResult] = await Promise.all([
    checkSupabase(),
    checkR2(),
    checkResend(),
    checkItunes(),
  ])

  const checks: CheckResult[] = [supabaseResult, r2Result, resendResult, itunesResult]

  const envStatus = ENV_VARS.map((name) => ({
    name,
    set: typeof process.env[name] === 'string' && process.env[name] !== '',
  }))

  return (
    <div>
      <AdminPageHeader
        title="API Health"
        description="Connectivity checks for Supabase, R2, Resend, and iTunes. Verify environment variables are set."
        action={<RefreshButton />}
      />

      {/* Service checks */}
      <div className="space-y-3 mb-8">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">External Services</h2>
        <div className="border border-zinc-800 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Service</th>
                <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Status</th>
                <th className="text-right px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Response</th>
                <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Detail</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check.name} className="border-b border-zinc-800/60 last:border-0">
                  <td className="px-4 py-2.5 text-zinc-200 font-medium">{check.name}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge ok={check.ok} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-zinc-400">{check.ms} ms</td>
                  <td className="px-4 py-2.5 text-xs text-zinc-500">{check.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Environment variables */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Environment Variables</h2>
        <div className="border border-zinc-800 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Variable</th>
                <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {envStatus.map(({ name, set }) => (
                <tr key={name} className="border-b border-zinc-800/60 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">{name}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={[
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                        set
                          ? 'bg-green-900/40 text-green-400 border border-green-800'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700',
                      ].join(' ')}
                    >
                      {set ? '✓ Set' : '✗ Missing'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
