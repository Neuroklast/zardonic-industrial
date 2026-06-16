import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/releases', label: 'Releases' },
  { href: '/admin/gigs', label: 'Gigs' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/bio', label: 'Bio' },
  { href: '/admin/social', label: 'Social Links' },
  { href: '/admin/partners', label: 'Partners' },
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
