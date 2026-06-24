'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLenisContext } from '@/contexts/LenisContext'
import { useLocale } from '@/contexts/LocaleContext'
import { ariaLabel } from '@/lib/i18n'
import { useAdminDraftListener } from '@/hooks/use-admin-draft'
import type { AdminDraftKey } from '@/lib/admin-draft-channel'
import { parseSectionsDraft } from '@/lib/apply-sections-draft'
import {
  buildNavLinks,
  defaultNavLinks,
  type NavLink,
} from '@/lib/nav-links'
import type { SectionConfig } from '@/lib/site-config-sections'

const LOGO_IMAGE = '/assets/images/meta_eyJzcmNCdWNrZXQiOiJiemdsZmlsZXMifQ==.webp'

interface SiteNavProps {
  links?: NavLink[]
}

function draftToNavLinks(value: Record<string, unknown>): NavLink[] | null {
  const draft = parseSectionsDraft(value)
  if (draft.length === 0) return null
  const sections: SectionConfig[] = draft.map((entry) => ({
    id: entry.id,
    label: entry.label ?? '',
    intro: entry.intro,
    visible: entry.visible,
    order: entry.order,
  }))
  return buildNavLinks(sections)
}

export function SiteNav({ links: initialLinks }: SiteNavProps) {
  const [open, setOpen] = useState(false)
  const [draftLinks, setDraftLinks] = useState<NavLink[] | null>(null)
  const baseLinks = useMemo(() => initialLinks ?? defaultNavLinks(), [initialLinks])
  const links = draftLinks ?? baseLinks
  const { scrollTo } = useLenisContext()
  const { locale } = useLocale()

  const onDraft = useCallback((key: AdminDraftKey, value: Record<string, unknown>) => {
    if (key !== 'sections') return
    const next = draftToNavLinks(value)
    if (next) setDraftLinks(next)
  }, [])

  useAdminDraftListener(onDraft)

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
    'shrink-0 whitespace-nowrap font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground hover-chromatic'

  return (
    <header
      className="fixed left-0 right-0 top-0 border-b border-border/60 bg-background/80 backdrop-blur-sm scanline-effect"
      style={{ zIndex: 'var(--z-nav)' as React.CSSProperties['zIndex'] }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-card">
        <Link
          href="/"
          aria-label="Zardonic – Home"
          className="logo-glitch shrink-0 hover-chromatic-image"
        >
          <Image
            src={LOGO_IMAGE}
            alt="Zardonic"
            width={120}
            height={40}
            className="h-9 w-auto object-contain brightness-110"
            priority
          />
        </Link>

        <nav
          className="hidden min-w-0 flex-1 justify-end overflow-x-auto md:flex [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          aria-label={ariaLabel('aria.mainNav', locale)}
        >
          <div className="flex items-center gap-3 px-0.5 lg:gap-4">
            {links.map((item) => (
              <a
                key={item.sectionId}
                href={item.href}
                data-draft-target={`nav-link-${item.sectionId}`}
                onClick={(e) => {
                  e.preventDefault()
                  navigateTo(item.href)
                }}
                className={`inline-flex min-h-[44px] items-center ${linkClass}`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <button
          type="button"
          className="ml-auto flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:ml-0 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? ariaLabel('aria.closeMenu', locale) : ariaLabel('aria.openMenu', locale)}
          aria-expanded={open}
        >
          <span className="font-mono text-xs tracking-widest">{open ? '[×]' : '[≡]'}</span>
        </button>
      </div>

      {open ? (
        <nav
          className="flex max-h-[min(70vh,28rem)] flex-col gap-1 overflow-y-auto border-t border-border/60 bg-background/95 px-card py-3 md:hidden"
          aria-label={ariaLabel('aria.mobileNav', locale)}
        >
          {links.map((item) => (
            <a
              key={item.sectionId}
              href={item.href}
              data-draft-target={`nav-link-${item.sectionId}`}
              onClick={(e) => {
                e.preventDefault()
                navigateTo(item.href)
              }}
              className={`inline-flex min-h-[44px] items-center ${linkClass}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  )
}