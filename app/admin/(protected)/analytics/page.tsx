import { createClient } from '@/lib/supabaseServer'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import {
  ChartBar,
  Envelope,
  Disc,
  Images,
  Calendar,
  Users,
} from '@phosphor-icons/react/dist/ssr'

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
      supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
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

export default async function AnalyticsPage() {
  const [counts, analyticsConfig] = await Promise.all([fetchCounts(), fetchAnalyticsConfig()])

  const stats = [
    { icon: Disc,    label: 'Releases',     value: counts.releases,    href: '/admin/releases' },
    { icon: Calendar, label: 'Events',       value: counts.gigs,        href: '/admin/gigs' },
    { icon: Images,  label: 'Gallery Images', value: counts.gallery,   href: '/admin/gallery' },
    { icon: Users,   label: 'Partners',     value: counts.partners,    href: '/admin/partners' },
    { icon: Envelope, label: 'Subscribers', value: counts.subscribers, href: '/admin/newsletter' },
    { icon: ChartBar, label: 'Social Links', value: counts.socialLinks, href: '/admin/social' },
  ]

  const analyticsEnabled = analyticsConfig.enabled !== false
  const trackPageViews = analyticsConfig.trackPageViews !== false
  const trackEvents = analyticsConfig.trackEvents !== false

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-zinc-400 text-sm mt-1">Content statistics and analytics tracking settings.</p>
      </div>

      {/* Content stats */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Content Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <a
                key={s.label}
                href={s.href}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {s.label}
                </div>
                <div className="text-2xl font-bold font-mono text-white">{s.value}</div>
              </a>
            )
          })}
        </div>
      </section>

      {/* Analytics tracking settings */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Tracking Settings</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
          <form action={async () => {
            'use server'
            const fd = new FormData()
            fd.set('key', 'analytics')
            fd.set('value', JSON.stringify({
              enabled: !analyticsEnabled,
              trackPageViews,
              trackEvents,
            }))
            await updateSiteConfig(fd)
          }}>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-white">Enable Analytics</p>
                <p className="text-xs text-zinc-400 mt-0.5">Disable to stop all client-side tracking.</p>
              </div>
              <button
                type="submit"
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${analyticsEnabled ? 'bg-red-600' : 'bg-zinc-700'}`}
                role="switch"
                aria-checked={analyticsEnabled}
                aria-label="Toggle analytics"
              >
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${analyticsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </form>

          {analyticsEnabled && (
            <>
              <form action={async () => {
                'use server'
                const fd = new FormData()
                fd.set('key', 'analytics')
                fd.set('value', JSON.stringify({ enabled: true, trackPageViews: !trackPageViews, trackEvents }))
                await updateSiteConfig(fd)
              }}>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Track Page Views</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Record each page navigation event.</p>
                  </div>
                  <button
                    type="submit"
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${trackPageViews ? 'bg-red-600' : 'bg-zinc-700'}`}
                    role="switch"
                    aria-checked={trackPageViews}
                    aria-label="Toggle page view tracking"
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${trackPageViews ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </form>

              <form action={async () => {
                'use server'
                const fd = new FormData()
                fd.set('key', 'analytics')
                fd.set('value', JSON.stringify({ enabled: true, trackPageViews, trackEvents: !trackEvents }))
                await updateSiteConfig(fd)
              }}>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Track Events</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Record button clicks and interactions.</p>
                  </div>
                  <button
                    type="submit"
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${trackEvents ? 'bg-red-600' : 'bg-zinc-700'}`}
                    role="switch"
                    aria-checked={trackEvents}
                    aria-label="Toggle event tracking"
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${trackEvents ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
