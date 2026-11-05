import { getApiSecret, getApiSecretsStatus } from '@/lib/api-secrets'
import { getSpotifyAccessTokenDetailed } from '@/lib/spotify-client'
import { createClient } from '@/lib/supabaseServer'
import { S3Client, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
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
      requestChecksumCalculation: 'WHEN_REQUIRED',
    })

    await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }))
    return { name: 'Cloudflare R2', ok: true, ms: Date.now() - start }
  } catch (e) {
    return { name: 'Cloudflare R2', ok: false, ms: Date.now() - start, detail: e instanceof Error ? e.message : 'Unknown error' }
  }
}

async function checkR2Cors(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const bucket = process.env.R2_BUCKET_MEDIA

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      return { name: 'R2 browser PUT preflight', ok: false, ms: Date.now() - start, detail: 'Missing R2 environment variables' }
    }

    // GetBucketCors is not a reliable upload check: a scoped R2 S3 key may
    // list and upload objects but lack permission to read the bucket policy.
    // Instead, test the same OPTIONS preflight a browser sends before upload.
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
    })
    const signedUrl = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: bucket, Key: '__healthcheck__/cors-preflight', ContentType: 'application/octet-stream' }),
      { expiresIn: 60 },
    )
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://zardonic.net').origin
    const res = await fetch(signedUrl, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'content-type',
      },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    const allowedOrigin = res.headers.get('access-control-allow-origin')
    const methods = res.headers.get('access-control-allow-methods') ?? ''
    const originOk = allowedOrigin === '*' || allowedOrigin === origin
    const putOk = methods.split(',').some((method) => method.trim().toUpperCase() === 'PUT')
    const ok = res.ok && originOk && putOk
    return {
      name: 'R2 browser PUT preflight',
      ok,
      ms: Date.now() - start,
      detail: ok ? `PUT allowed from ${origin}` : `Preflight HTTP ${res.status} (origin: ${originOk ? 'ok' : 'blocked'}, PUT: ${putOk ? 'ok' : 'blocked'})`,
    }
  } catch (e) {
    return { name: 'R2 browser PUT preflight', ok: false, ms: Date.now() - start, detail: e instanceof Error ? e.message : 'Preflight failed' }
  }
}

async function checkSpotify(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const auth = await getSpotifyAccessTokenDetailed()
    return {
      name: 'Spotify OAuth',
      ok: auth.ok,
      ms: Date.now() - start,
      detail: auth.ok ? 'Client credentials validated' : auth.message,
    }
  } catch {
    return { name: 'Spotify OAuth', ok: false, ms: Date.now() - start, detail: 'Could not check Spotify credentials' }
  }
}

async function checkResend(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const key = await getApiSecret('resend_api_key')
    if (!key) {
      return { name: 'Resend Email API', ok: false, ms: Date.now() - start, detail: 'Resend API key not set' }
    }
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: 'Bearer ' + key },
      signal: AbortSignal.timeout(5000),
    })
    // HTTP 401 is an invalid credential, not a successful connectivity check.
    const providerBody: unknown = res.ok ? null : await res.json().catch(() => null)
    const providerCode = providerBody && typeof providerBody === 'object' && 'name' in providerBody
      ? String((providerBody as { name: unknown }).name) : ''
    const sendOnly = providerCode === 'restricted_api_key'
    const ok = res.ok || sendOnly
    const detail = sendOnly
      ? 'Sending-only API key: domain listing cannot be verified. Review Contact & Email Errors.'
      : res.status === 401
        ? 'HTTP 401: Invalid Resend API key.'
        : res.status === 403
          ? 'HTTP 403: Domain lookup forbidden. Check API key permissions in Contact & Email Errors.'
          : ok ? undefined : `HTTP ${res.status}`
    return { name: 'Resend Email API', ok, ms: Date.now() - start, detail }
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
  'SECRETS_ENCRYPTION_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_MEDIA',
  'R2_PUBLIC_HOST',
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
  const [supabaseResult, r2Result, r2CorsResult, spotifyResult, resendResult, itunesResult, apiSecretsStatus] = await Promise.all([
    checkSupabase(),
    checkR2(),
    checkR2Cors(),
    checkSpotify(),
    checkResend(),
    checkItunes(),
    getApiSecretsStatus(),
  ])

  const checks: CheckResult[] = [supabaseResult, r2Result, r2CorsResult, spotifyResult, resendResult, itunesResult]

  const integrationKeys = [
    { label: 'Spotify keys stored (authentication checked above)', ok: apiSecretsStatus.spotify_client_id && apiSecretsStatus.spotify_client_secret },
    { label: 'Discogs', ok: apiSecretsStatus.discogs_token },
    { label: 'Bandsintown', ok: apiSecretsStatus.bandsintown_api_key },
    { label: 'Resend', ok: apiSecretsStatus.resend_api_key },
  ]

  const envStatus = ENV_VARS.map((name) => ({
    name,
    set: typeof process.env[name] === 'string' && process.env[name] !== '',
  }))

  return (
    <div>
      <AdminPageHeader
        title="API Health"
        description="Connectivity checks for Supabase, R2, Resend, and iTunes. Integration keys are managed under Admin → API Keys."
        action={<RefreshButton />}
      />

      {/* Service checks */}
      <div className="space-y-3 mb-8">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">External Services</h2>
        <div className="border border-zinc-800 rounded overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
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

      {/* Integration API keys */}
      <div className="space-y-3 mb-8">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Integration API Keys</h2>
        <div className="border border-zinc-800 rounded overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[24rem] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Service</th>
                <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {integrationKeys.map(({ label, ok }) => (
                <tr key={label} className="border-b border-zinc-800/60 last:border-0">
                  <td className="px-4 py-2.5 text-zinc-200 font-medium">{label}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge ok={ok} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Environment variables */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Infrastructure Environment Variables</h2>
        <div className="border border-zinc-800 rounded overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[24rem] text-sm">
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
