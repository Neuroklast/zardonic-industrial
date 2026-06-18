import { createClient } from '@/lib/supabaseServer'
import { ShieldWarning, ShieldCheck, Key, Users } from '@phosphor-icons/react/dist/ssr'

interface SecurityStats {
  subscriberCount: number
}

async function fetchSecurityStats(): Promise<SecurityStats> {
  try {
    const supabase = await createClient()
    const { count } = await supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
    return { subscriberCount: count ?? 0 }
  } catch {
    return { subscriberCount: 0 }
  }
}

export default async function SecurityPage() {
  const stats = await fetchSecurityStats()

  const items = [
    {
      icon: ShieldCheck,
      iconClass: 'text-green-400',
      title: 'Row Level Security',
      description: 'All Supabase tables have RLS enabled. Public reads are restricted to active rows only. Admin writes require a valid session with role = admin.',
      status: 'Active',
      statusClass: 'text-green-400 bg-green-900/20 border-green-700/40',
    },
    {
      icon: Key,
      iconClass: 'text-yellow-400',
      title: 'Admin Authentication',
      description: 'Admin access is protected by Supabase SSR session. The middleware.ts file enforces authentication on all /admin/* routes.',
      status: 'Active',
      statusClass: 'text-green-400 bg-green-900/20 border-green-700/40',
    },
    {
      icon: ShieldWarning,
      iconClass: 'text-red-400',
      title: 'Rate Limiting',
      description: 'API rate limiting is enforced in middleware.ts via Redis (Upstash). The RATE_LIMIT_SALT env var must be set for full IP anonymisation.',
      status: 'Review env vars',
      statusClass: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/40',
    },
    {
      icon: Users,
      iconClass: 'text-blue-400',
      title: 'Newsletter Subscribers',
      description: `${stats.subscriberCount} subscriber${stats.subscriberCount !== 1 ? 's' : ''} stored with consent flag. Admin access only via RLS. Unsubscribe timestamps tracked.`,
      status: `${stats.subscriberCount} records`,
      statusClass: 'text-blue-400 bg-blue-900/20 border-blue-700/40',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Security</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Overview of security controls for this Supabase-backed application.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex gap-4"
            >
              <div className="shrink-0 mt-0.5">
                <Icon weight="bold" className={`h-5 w-5 ${item.iconClass}`} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h2 className="font-semibold text-white text-sm">{item.title}</h2>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${item.statusClass} shrink-0`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm mt-1">{item.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="font-semibold text-white text-sm mb-3">Environment Variables</h2>
        <div className="space-y-2">
          {[
            { name: 'RATE_LIMIT_SALT', required: true, desc: 'Salt for IP anonymisation in rate limiter. Must be set in production.' },
            { name: 'UPSTASH_REDIS_REST_URL', required: true, desc: 'Redis URL for rate limiting and session storage.' },
            { name: 'UPSTASH_REDIS_REST_TOKEN', required: true, desc: 'Redis token for authentication.' },
            { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true, desc: 'Service role key for admin Supabase operations.' },
          ].map((v) => (
            <div key={v.name} className="flex items-start gap-3 text-sm">
              <code className={`font-mono text-xs px-1.5 py-0.5 rounded shrink-0 ${v.required ? 'bg-red-900/20 text-red-300 border border-red-800/40' : 'bg-zinc-800 text-zinc-300'}`}>
                {v.name}
              </code>
              <span className="text-zinc-400">{v.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
