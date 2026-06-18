import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'

async function getCounts() {
  try {
    const supabase = await createClient()
    const [releases, gigs, gallery, bio, social, partners, soundpacks, merchandise, musicHighlights, siteConfig] =
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
        supabase.from('site_config').select('id', { count: 'exact', head: true }),
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
      siteConfig: siteConfig.count ?? 0,
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
      siteConfig: 0,
    }
  }
}

const COUNT_SECTIONS = [
  { href: '/admin/releases', label: 'Releases', key: 'releases' as const },
  { href: '/admin/gigs', label: 'Gigs', key: 'gigs' as const },
  { href: '/admin/gallery', label: 'Gallery', key: 'gallery' as const },
  { href: '/admin/soundpacks', label: 'Sound Packs', key: 'soundpacks' as const },
  { href: '/admin/merchandise', label: 'Merchandise', key: 'merchandise' as const },
  { href: '/admin/music-highlights', label: 'Music Highlights', key: 'musicHighlights' as const },
  { href: '/admin/partners', label: 'Partners', key: 'partners' as const },
]

const LINK_SECTIONS = [
  { href: '/admin/bio', label: 'Bio' },
  { href: '/admin/social', label: 'Social Links' },
  { href: '/admin/site-config', label: 'Site Config' },
]

export default async function AdminDashboard() {
  const counts = await getCounts()

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {COUNT_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
          >
            <div className="text-2xl font-bold text-white">{counts[section.key]}</div>
            <div className="text-sm text-zinc-400 mt-1">{section.label}</div>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {LINK_SECTIONS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors text-sm text-zinc-300"
          >
            {item.label} →
          </Link>
        ))}
      </div>
    </div>
  )
}
