import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { ADMIN_NAV_GROUPS } from '@/app/admin/_config/nav-groups'

type CountKey =
  | 'releases'
  | 'gigs'
  | 'gallery'
  | 'bio'
  | 'social'
  | 'partners'
  | 'soundpacks'
  | 'merchandise'
  | 'musicHighlights'

async function getCounts(): Promise<Record<CountKey, number>> {
  try {
    const supabase = await createClient()
    const [releases, gigs, gallery, bio, social, partners, soundpacks, merchandise, musicHighlights] =
      await Promise.all([
        supabase.from('releases').select('id', { count: 'exact', head: true }),
        supabase.from('gigs').select('id', { count: 'exact', head: true }),
        supabase.from('gallery').select('id', { count: 'exact', head: true }),
        supabase.from('bio').select('id', { count: 'exact', head: true }),
        supabase.from('social_links').select('id', { count: 'exact', head: true }),
        supabase.from('partners').select('id', { count: 'exact', head: true }),
        supabase.from('soundpacks').select('id', { count: 'exact', head: true }),
        supabase.from('merchandise').select('id', { count: 'exact', head: true }),
        supabase.from('music_highlights').select('id', { count: 'exact', head: true }),
      ])
    return {
      releases: releases.count ?? 0,
      gigs: gigs.count ?? 0,
      gallery: gallery.count ?? 0,
      bio: bio.count ?? 0,
      social: social.count ?? 0,
      partners: partners.count ?? 0,
      soundpacks: soundpacks.count ?? 0,
      merchandise: merchandise.count ?? 0,
      musicHighlights: musicHighlights.count ?? 0,
    }
  } catch {
    return {
      releases: 0,
      gigs: 0,
      gallery: 0,
      bio: 0,
      social: 0,
      partners: 0,
      soundpacks: 0,
      merchandise: 0,
      musicHighlights: 0,
    }
  }
}

export default async function AdminDashboard() {
  const counts = await getCounts()

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of site content and quick links to common admin tasks."
        action={
          <>
            <Link
              href="/admin/site-config"
              className="px-3 py-1.5 text-sm rounded border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            >
              Look &amp; Feel
            </Link>
            <Link
              href="/admin/data"
              className="px-3 py-1.5 text-sm rounded border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            >
              Import / Export
            </Link>
            <Link
              href="/admin/releases/sync"
              className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
            >
              iTunes Sync
            </Link>
          </>
        }
      />

      <div className="space-y-8">
        {ADMIN_NAV_GROUPS.filter((g) => g.id !== 'overview').map((group) => (
          <section key={group.id}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">{group.label}</h2>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {group.items.map((item) => {
                const count =
                  item.countKey && item.countKey in counts
                    ? counts[item.countKey as CountKey]
                    : null
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
                  >
                    {count !== null && (
                      <div className="text-2xl font-bold text-white mb-1">{count}</div>
                    )}
                    <div className={`text-sm ${count !== null ? 'text-zinc-400' : 'text-zinc-200'}`}>
                      {item.label}
                    </div>
                    {count === null && <div className="text-xs text-zinc-500 mt-1">Open →</div>}
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}