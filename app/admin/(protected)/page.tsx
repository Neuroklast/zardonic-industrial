import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'

async function getCounts() {
  try {
    const supabase = await createClient()
    const [releases, gigs, gallery] = await Promise.all([
      supabase.from('releases').select('id', { count: 'exact', head: true }),
      supabase.from('gigs').select('id', { count: 'exact', head: true }),
      supabase.from('gallery').select('id', { count: 'exact', head: true }),
    ])
    return {
      releases: releases.count ?? 0,
      gigs: gigs.count ?? 0,
      gallery: gallery.count ?? 0,
    }
  } catch {
    return { releases: 0, gigs: 0, gallery: 0 }
  }
}

const SECTIONS = [
  { href: '/admin/releases', label: 'Releases', key: 'releases' as const },
  { href: '/admin/gigs', label: 'Gigs', key: 'gigs' as const },
  { href: '/admin/gallery', label: 'Gallery', key: 'gallery' as const },
]

export default async function AdminDashboard() {
  const counts = await getCounts()

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {SECTIONS.map((section) => (
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
      <div className="grid grid-cols-2 gap-4">
        {[
          { href: '/admin/bio', label: 'Edit Bio' },
          { href: '/admin/social', label: 'Social Links' },
          { href: '/admin/partners', label: 'Partners & Friends' },
        ].map((item) => (
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
