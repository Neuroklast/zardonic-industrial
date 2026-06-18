'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  House,
  Gear,
  TextAlignLeft,
  Disc,
  ArrowsClockwise,
  Waveform,
  TShirt,
  Package,
  Calendar,
  Images,
  Users,
  Share,
  SignOut,
  List,
  X,
  Rows,
  EnvelopeSimple,
  Heartbeat,
  ChartBar,
  Export,
  Translate,
  SpeakerHigh,
} from '@phosphor-icons/react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',                  label: 'Dashboard',        icon: House,          exact: true },
  { href: '/admin/site-config',      label: 'Site Config',      icon: Gear },
  { href: '/admin/sections',         label: 'Sections',         icon: Rows },
  { href: '/admin/bio',              label: 'Biography',        icon: TextAlignLeft },
  { href: '/admin/releases',         label: 'Discography',      icon: Disc },
  { href: '/admin/releases/sync',    label: 'iTunes Sync',      icon: ArrowsClockwise },
  { href: '/admin/music-highlights', label: 'Music Highlights', icon: Waveform },
  { href: '/admin/merchandise',      label: 'Merchandise',      icon: TShirt },
  { href: '/admin/soundpacks',       label: 'Soundpacks',       icon: Package },
  { href: '/admin/gigs',             label: 'Events',           icon: Calendar },
  { href: '/admin/gallery',          label: 'Gallery',          icon: Images },
  { href: '/admin/partners',         label: 'Credits & Partners', icon: Users },
  { href: '/admin/social',           label: 'Social Links',     icon: Share },
  { href: '/admin/newsletter',       label: 'Newsletter',       icon: EnvelopeSimple },
  { href: '/admin/health',           label: 'API Health',       icon: Heartbeat },
  { href: '/admin/analytics',        label: 'Analytics',        icon: ChartBar },
  { href: '/admin/data',             label: 'Data Export',      icon: Export },
  { href: '/admin/translations',     label: 'Translations',     icon: Translate },
  { href: '/admin/sound',            label: 'Sound',            icon: SpeakerHigh },
]

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname()
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={[
        'flex items-center gap-3 rounded px-3 py-3 text-sm font-medium transition-colors',
        active
          ? 'bg-red-900/30 text-red-400 border border-red-900/40'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent',
      ].join(' ')}
    >
      <Icon weight={active ? 'fill' : 'regular'} className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

function NavLinks({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 flex-1" aria-label="Admin navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} onClick={onNavClick} />
      ))}
    </nav>
  )
}

export function AdminNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-zinc-950 border-r border-zinc-800 min-h-screen sticky top-0 h-screen">
        <div className="p-4 border-b border-zinc-800">
          <span className="font-mono font-bold tracking-[0.2em] text-sm text-white uppercase">Zardonic</span>
          <span className="ml-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Admin</span>
        </div>
        <div className="flex flex-col flex-1 p-3 overflow-y-auto">
          <NavLinks />
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <Link
              href="/admin/logout"
              className="flex items-center gap-3 rounded px-3 py-3 text-sm font-medium text-red-500 hover:bg-zinc-800 hover:text-red-400 border border-transparent transition-colors"
            >
              <SignOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              Sign Out
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
        <span className="font-mono font-bold tracking-[0.2em] text-sm text-white uppercase">
          Zardonic <span className="text-zinc-500 text-[10px] font-mono">Admin</span>
        </span>
        <button
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center justify-center text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] rounded transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/80"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          'md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800',
          'transform transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Mobile admin navigation"
      >
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="font-mono font-bold tracking-[0.2em] text-sm text-white uppercase">Admin</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center justify-center text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col flex-1 p-3 overflow-y-auto h-[calc(100vh-56px)]">
          <NavLinks onNavClick={() => setMobileOpen(false)} />
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <Link
              href="/admin/logout"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded px-3 py-3 text-sm font-medium text-red-500 hover:bg-zinc-800 hover:text-red-400 border border-transparent transition-colors"
            >
              <SignOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              Sign Out
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
