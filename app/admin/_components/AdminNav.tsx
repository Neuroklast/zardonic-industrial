import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  // Site settings
  { href: '/admin/site-config', label: 'Site Config' },
  // Content
  { href: '/admin/bio', label: 'Biography' },
  { href: '/admin/releases', label: 'Discography' },
  { href: '/admin/music-highlights', label: 'Music Highlights' },
  { href: '/admin/merchandise', label: 'Merchandise' },
  { href: '/admin/soundpacks', label: 'Soundpacks' },
  { href: '/admin/gigs', label: 'Events' },
  { href: '/admin/gallery', label: 'Gallery' },
  // People & brands
  { href: '/admin/partners', label: 'Credits & Partners' },
  { href: '/admin/social', label: 'Social Links' },
]

export function AdminNav() {
  return (
    <nav className="w-48 shrink-0 bg-zinc-900 border-r border-zinc-800 min-h-full p-4">
      <div className="mb-6">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Zardonic CMS</span>
      </div>
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block px-3 py-2 rounded text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
