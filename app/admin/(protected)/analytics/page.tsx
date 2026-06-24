import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { AnalyticsSettings } from './AnalyticsSettings'
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

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Content statistics and analytics tracking settings."
      />

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Content Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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

      <AnalyticsSettings initialConfig={analyticsConfig} />
    </div>
  )
}