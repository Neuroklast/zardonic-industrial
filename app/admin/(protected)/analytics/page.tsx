import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { AnalyticsSettings } from './AnalyticsSettings'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import {
  buildAnalyticsInsights,
  type AnalyticsEventRow,
} from '@/lib/analytics-insights'
import {
  ChartBar,
  Envelope,
  Disc,
  Images,
  Calendar,
  Users,
} from '@phosphor-icons/react/dist/ssr'

const RANGE_DAYS = 30
const MAX_EVENTS = 5000

interface ContentCounts {
  releases: number
  gigs: number
  gallery: number
  partners: number
  subscribers: number
  socialLinks: number
}

async function fetchCounts(): Promise<ContentCounts> {
  try {
    const supabase = await createClient()
    const [r, g, gal, p, s, sl] = await Promise.all([
      supabase.from('releases').select('id', { count: 'exact', head: true }),
      supabase.from('gigs').select('id', { count: 'exact', head: true }),
      supabase.from('gallery').select('id', { count: 'exact', head: true }),
      supabase.from('partners').select('id', { count: 'exact', head: true }),
      supabase
        .from('newsletter_subscribers')
        .select('id', { count: 'exact', head: true })
        .not('confirmed_at', 'is', null)
        .is('unsubscribed_at', null),
      supabase.from('social_links').select('id', { count: 'exact', head: true }),
    ])
    return {
      releases: r.count ?? 0,
      gigs: g.count ?? 0,
      gallery: gal.count ?? 0,
      partners: p.count ?? 0,
      subscribers: s.count ?? 0,
      socialLinks: sl.count ?? 0,
    }
  } catch {
    return { releases: 0, gigs: 0, gallery: 0, partners: 0, subscribers: 0, socialLinks: 0 }
  }
}

async function fetchAnalyticsConfig(): Promise<Record<string, unknown>> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_config').select('value').eq('key', 'analytics').single()
    return (data?.value as Record<string, unknown>) ?? {}
  } catch {
    return {}
  }
}

async function fetchAnalyticsEvents(): Promise<AnalyticsEventRow[]> {
  try {
    const since = new Date()
    since.setUTCDate(since.getUTCDate() - RANGE_DAYS)

    // Service role: analytics_events is insert-only from public; admin needs read.
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('analytics_events')
      .select('id, type, target, meta, heatmap, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(MAX_EVENTS)

    if (error) {
      console.warn('[admin/analytics] fetch events:', error.message)
      return []
    }

    return (data ?? []).map((row: {
      id: string
      type: string
      target: string | null
      meta: unknown
      heatmap: unknown
      created_at: string
    }) => ({
      id: String(row.id),
      type: String(row.type),
      target: row.target == null ? null : String(row.target),
      meta: (row.meta as Record<string, unknown> | null) ?? null,
      heatmap: (row.heatmap as AnalyticsEventRow['heatmap']) ?? null,
      created_at: String(row.created_at),
    }))
  } catch (e) {
    console.warn('[admin/analytics] fetch failed', e)
    return []
  }
}

export default async function AnalyticsPage() {
  const [counts, analyticsConfig, events] = await Promise.all([
    fetchCounts(),
    fetchAnalyticsConfig(),
    fetchAnalyticsEvents(),
  ])

  const insights = buildAnalyticsInsights(events, RANGE_DAYS)

  const stats = [
    { icon: Disc, label: 'Releases', value: counts.releases, href: '/admin/releases' },
    { icon: Calendar, label: 'Events', value: counts.gigs, href: '/admin/gigs' },
    { icon: Images, label: 'Gallery Images', value: counts.gallery, href: '/admin/gallery' },
    { icon: Users, label: 'Partners', value: counts.partners, href: '/admin/partners' },
    { icon: Envelope, label: 'Active Subscribers', value: counts.subscribers, href: '/admin/newsletter' },
    { icon: ChartBar, label: 'Social Links', value: counts.socialLinks, href: '/admin/social' },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Traffic, heatmaps, content stats, and tracking settings. Consent-gated first-party data only."
      />

      <section className="mb-10">
        <AnalyticsDashboard
          insights={insights}
          sampleSize={events.length}
          rangeDays={RANGE_DAYS}
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Content overview</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <a
                key={s.label}
                href={s.href}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-zinc-400">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {s.label}
                </div>
                <div className="font-mono text-2xl font-bold text-white">{s.value}</div>
              </a>
            )
          })}
        </div>
      </section>

      <AnalyticsSettings initialConfig={analyticsConfig} />
    </div>
  )
}
