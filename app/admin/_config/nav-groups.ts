export interface AdminNavItemData {
  href: string
  label: string
  /** If true, only exact pathname match counts as active */
  exact?: boolean
  /** Dashboard count key (optional) */
  countKey?: string
}

export interface AdminNavGroupData {
  id: string
  label: string
  items: AdminNavItemData[]
}

/** Server-safe nav structure (no icon imports). */
export const ADMIN_NAV_GROUPS: AdminNavGroupData[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', exact: true }],
  },
  {
    id: 'design',
    label: 'Site Design',
    items: [
      { href: '/admin/site-config', label: 'Site Config' },
      { href: '/admin/translations', label: 'Translations' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      { href: '/admin/bio', label: 'Biography' },
      { href: '/admin/gallery', label: 'Gallery', countKey: 'gallery' },
      { href: '/admin/partners', label: 'Credits & Partners', countKey: 'partners' },
      { href: '/admin/music-highlights', label: 'Music Highlights', countKey: 'musicHighlights' },
      { href: '/admin/releases', label: 'Discography', countKey: 'releases' },
      { href: '/admin/gigs', label: 'Events', countKey: 'gigs' },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    items: [
      { href: '/admin/merchandise', label: 'Merchandise', countKey: 'merchandise' },
      { href: '/admin/soundpacks', label: 'Soundpacks', countKey: 'soundpacks' },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    items: [
      { href: '/admin/social', label: 'Social Links', countKey: 'social' },
      { href: '/admin/newsletter', label: 'Newsletter' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { href: '/admin/sound', label: 'Sound' },
      { href: '/admin/analytics', label: 'Analytics' },
      { href: '/admin/health', label: 'API Health' },
      { href: '/admin/data', label: 'Data Import/Export' },
    ],
  },
]

export const ADMIN_NAV_ITEMS: AdminNavItemData[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items)

export function resolveActiveNavItem(pathname: string): AdminNavItemData | null {
  let best: AdminNavItemData | null = null
  let bestLen = -1

  for (const item of ADMIN_NAV_ITEMS) {
    const matches = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
    if (!matches) continue
    if (item.href.length > bestLen) {
      best = item
      bestLen = item.href.length
    }
  }

  return best
}

export function isNavItemActive(pathname: string, item: AdminNavItemData): boolean {
  const active = resolveActiveNavItem(pathname)
  return active?.href === item.href
}