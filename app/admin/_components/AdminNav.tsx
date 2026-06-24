'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SignOut, List, X, MagnifyingGlass } from '@phosphor-icons/react'
import { openAdminHelp } from '@/app/admin/_components/AdminHelpPalette'
import { getAdminHelpShortcutLabel } from '@/lib/admin-help-shortcut'
import {
  House,
  Gear,
  TextAlignLeft,
  Disc,
  Waveform,
  TShirt,
  Package,
  Calendar,
  Images,
  Users,
  Share,
  EnvelopeSimple,
  Heartbeat,
  ChartBar,
  Export,
  Translate,
  Key,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import {
  ADMIN_NAV_GROUPS,
  isNavItemActive,
  type AdminNavItemData,
} from '@/app/admin/_config/nav-groups'

const NAV_ICONS: Record<string, Icon> = {
  '/admin': House,
  '/admin/site-config': Gear,
  '/admin/legal': Gear,
  '/admin/translations': Translate,
  '/admin/bio': TextAlignLeft,
  '/admin/gallery': Images,
  '/admin/partners': Users,
  '/admin/music-highlights': Waveform,
  '/admin/releases': Disc,
  '/admin/releases/sync': Disc,
  '/admin/gigs': Calendar,
  '/admin/merchandise': TShirt,
  '/admin/soundpacks': Package,
  '/admin/social': Share,
  '/admin/newsletter': EnvelopeSimple,
  '/admin/analytics': ChartBar,
  '/admin/api-keys': Key,
  '/admin/health': Heartbeat,
  '/admin/data': Export,
}

function NavLink({ item, onClick }: { item: AdminNavItemData; onClick?: () => void }) {
  const pathname = usePathname()
  const active = isNavItemActive(pathname, item)
  const Icon = NAV_ICONS[item.href] ?? House

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

function HelpSearchButton({ onClick }: { onClick?: () => void }) {
  const shortcutLabel = getAdminHelpShortcutLabel()

  return (
    <button
      type="button"
      onClick={() => {
        openAdminHelp()
        onClick?.()
      }}
      className="w-full flex items-center gap-2 rounded px-3 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors text-left mb-3 min-h-[44px]"
      aria-label="Open admin help and quick search"
    >
      <MagnifyingGlass className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0 leading-snug">Help &amp; Search</span>
      <kbd className="shrink-0 text-[10px] font-mono text-zinc-600 border border-zinc-700 rounded px-1.5 py-0.5">
        {shortcutLabel}
      </kbd>
    </button>
  )
}

function NavLinks({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-4 flex-1" aria-label="Admin navigation">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} onClick={onNavClick} />
            ))}
          </div>
        </div>
      ))}

    </nav>
  )
}

interface AdminNavProps {
  /** Mobile header + drawer only (desktop sidebar rendered by AdminShell). */
  mobileOnly?: boolean
  /** Desktop sidebar only (inside resizable panel). */
  sidebarOnly?: boolean
  className?: string
}

function DesktopSidebar({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`flex flex-col w-full bg-zinc-950 border-r border-zinc-800 min-h-screen h-full ${className}`}
    >
      <div className="p-4 border-b border-zinc-800 shrink-0">
        <span className="font-mono font-bold tracking-[0.2em] text-sm text-white uppercase">Zardonic</span>
        <span className="ml-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Admin</span>
      </div>
      <div className="flex flex-col flex-1 min-h-0 p-3 overflow-y-auto">
        <HelpSearchButton />
        <NavLinks />
        <div className="mt-4 pt-4 border-t border-zinc-800 shrink-0">
          <form method="POST" action="/admin/logout" className="contents">
            <button
              type="submit"
              className="w-full flex items-center gap-3 rounded px-3 py-3 text-sm font-medium text-red-500 hover:bg-zinc-800 hover:text-red-400 border border-transparent transition-colors text-left"
            >
              <SignOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}

export function AdminNav({ mobileOnly = false, sidebarOnly = false, className = '' }: AdminNavProps = {}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const showMobile = !sidebarOnly
  const showDesktop = !mobileOnly

  useEffect(() => {
    if (!mobileOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [mobileOpen])

  return (
    <>
      {showDesktop ? (
        sidebarOnly ? (
          <DesktopSidebar className={className} />
        ) : (
          <div className="hidden md:block">
            <DesktopSidebar />
          </div>
        )
      ) : null}

      {showMobile ? (
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
        <span className="font-mono font-bold tracking-[0.2em] text-sm text-white uppercase">
          Zardonic <span className="text-zinc-500 text-[10px] font-mono">Admin</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Open admin help and quick search"
            onClick={() => openAdminHelp()}
            className="inline-flex items-center justify-center text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] rounded transition-colors"
          >
            <MagnifyingGlass className="h-5 w-5" />
          </button>
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
      </div>
      ) : null}

      {showMobile && mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/80"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {showMobile ? (
      <aside
        className={[
          'md:hidden fixed inset-y-0 left-0 z-[60] w-64 bg-zinc-950 border-r border-zinc-800',
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
          <HelpSearchButton onClick={() => setMobileOpen(false)} />
          <NavLinks onNavClick={() => setMobileOpen(false)} />
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <form method="POST" action="/admin/logout" className="contents">
              <button
                type="submit"
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center gap-3 rounded px-3 py-3 text-sm font-medium text-red-500 hover:bg-zinc-800 hover:text-red-400 border border-transparent transition-colors text-left"
              >
                <SignOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>
      ) : null}
    </>
  )
}