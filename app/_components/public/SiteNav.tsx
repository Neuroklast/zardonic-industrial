'use client'

import { useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '#bio', label: 'Bio' },
  { href: '#music', label: 'Music' },
  { href: '#releases', label: 'Releases' },
  { href: '#merch', label: 'Merch' },
  { href: '#events', label: 'Events' },
  { href: '#contact', label: 'Contact' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[var(--z-nav)] border-b border-zinc-800/60 bg-black/60 backdrop-blur-sm"
      style={{ zIndex: 'var(--z-nav)' as React.CSSProperties['zIndex'] }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono font-bold text-sm tracking-widest text-white hover:text-zinc-300 transition-colors"
        >
          ZARDONIC
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-xs tracking-widest text-zinc-400 hover:text-white transition-colors uppercase"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-zinc-400 hover:text-white transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <span className="font-mono text-xs tracking-widest">{open ? '[×]' : '[≡]'}</span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav
          className="md:hidden border-t border-zinc-800/60 bg-black/90 px-4 py-4 flex flex-col gap-4"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-mono text-xs tracking-widest text-zinc-400 hover:text-white transition-colors uppercase"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
