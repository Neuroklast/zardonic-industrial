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

  // Readable size; compact tracking so many items still fit
  const linkClass =
    'shrink-0 whitespace-nowrap text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground hover-chromatic sm:text-[0.8125rem] md:text-sm lg:tracking-[0.16em]'

  return (
    <header
      className="fixed left-0 right-0 top-0 border-b border-border/60 bg-background/85 backdrop-blur-sm"
      style={{ zIndex: 'var(--z-nav)' as React.CSSProperties['zIndex'] }}
    >
      {/*
        Logo is absolutely positioned in a fixed-width slot.
        Nav has matching padding-left so labels never sit under the logo.
      */}
      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-card">
        <Link
          href="/"
          aria-label="Zardonic – Home"
          className="absolute left-[var(--spacing-card,1.25rem)] top-1/2 z-20 flex h-10 w-14 -translate-y-1/2 items-center justify-start overflow-hidden sm:w-16"
        >
          <Image
            src={LOGO_IMAGE}
            alt="Zardonic"
            width={64}
            height={40}
            className="h-8 w-auto max-h-8 max-w-full object-contain object-left brightness-110"
            priority
          />
        </Link>

        <nav
          className="hidden min-w-0 flex-1 justify-end overflow-x-auto pl-16 sm:pl-[4.75rem] md:flex [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          aria-label={ariaLabel('aria.mainNav', locale)}
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          <div className="flex items-center gap-x-3 gap-y-1 px-0.5 lg:gap-x-4 xl:gap-x-5">
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
          className="ml-auto flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? ariaLabel('aria.closeMenu', locale) : ariaLabel('aria.openMenu', locale)}
          aria-expanded={open}
        >
          <span
            className="text-sm tracking-widest"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            {open ? '[×]' : '[≡]'}
          </span>
        </button>
      </div>

      {open ? (
        <nav
          className="flex max-h-[min(70vh,28rem)] flex-col gap-1 overflow-y-auto border-t border-border/60 bg-background/95 px-card py-3 md:hidden"
          aria-label={ariaLabel('aria.mobileNav', locale)}
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
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
              className={`inline-flex min-h-[48px] items-center ${linkClass}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  )
}
