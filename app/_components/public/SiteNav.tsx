'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLenisContext } from '@/contexts/LenisContext'
import { useLocale } from '@/contexts/LocaleContext'
import { ariaLabel } from '@/lib/i18n'

const LOGO_IMAGE = '/assets/images/meta_eyJzcmNCdWNrZXQiOiJiemdsZmlsZXMifQ==.webp'

const NAV_LINKS = [
  { href: '#bio', label: 'Bio' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#music', label: 'Music' },
  { href: '#releases', label: 'Releases' },
  { href: '#merch', label: 'Merch' },
  { href: '#gigs', label: 'Events' },
  { href: '#newsletter', label: 'Newsletter' },
  { href: '#contact', label: 'Contact' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const { scrollTo } = useLenisContext()
  const { locale } = useLocale()

  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const navigateTo = (href: string) => {
    const id = href.replace('#', '')
    scrollTo(id, { offset: -60 })
    setOpen(false)
  }

  const linkClass =
    'font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground hover-chromatic'

  return (
    <header
      className="fixed left-0 right-0 top-0 border-b border-border/60 bg-background/80 backdrop-blur-sm scanline-effect"
      style={{ zIndex: 'var(--z-nav)' as React.CSSProperties['zIndex'] }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-card">
        <Link href="/" aria-label="Zardonic – Home" className="logo-glitch hover-chromatic-image">
          <Image
            src={LOGO_IMAGE}
            alt="Zardonic"
            width={120}
            height={40}
            className="h-9 w-auto object-contain brightness-110"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-5 md:flex" aria-label={ariaLabel('aria.mainNav', locale)}>
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                e.preventDefault()
                navigateTo(l.href)
              }}
              className={`inline-flex min-h-[44px] items-center ${linkClass}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? ariaLabel('aria.closeMenu', locale) : ariaLabel('aria.openMenu', locale)}
          aria-expanded={open}
        >
          <span className="font-mono text-xs tracking-widest">{open ? '[×]' : '[≡]'}</span>
        </button>
      </div>

      {open ? (
        <nav
          className="flex flex-col gap-1 border-t border-border/60 bg-background/95 px-card py-3 md:hidden"
          aria-label={ariaLabel('aria.mobileNav', locale)}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                e.preventDefault()
                navigateTo(l.href)
              }}
              className={`inline-flex min-h-[44px] items-center ${linkClass}`}
            >
              {l.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  )
}