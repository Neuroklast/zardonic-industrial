'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLenisContext } from '@/contexts/LenisContext'
import { useLocale } from '@/contexts/LocaleContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useAdminDraftListener } from '@/hooks/use-admin-draft'
import type { AdminDraftKey } from '@/lib/admin-draft-channel'
import { parseSectionsDraft } from '@/lib/apply-sections-draft'
import {
  buildNavLinks,
  defaultNavLinks,
  type NavLink,
} from '@/lib/nav-links'
import { getNavIcon } from '@/lib/nav-icons'
import { NAV_LABEL_I18N_KEYS } from '@/lib/locale-detect'
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

function useTranslatedNavLabel(sectionId: string, fallback: string): string {
  const { t } = useLocale()
  const key = NAV_LABEL_I18N_KEYS[sectionId]
  if (!key) return fallback
  const translated = t(key)
  // t() returns key if missing — keep English compact fallback
  return translated === key ? fallback : translated
}

function DesktopNavLink({
  item,
  onNavigate,
}: {
  item: NavLink
  onNavigate: (href: string) => void
}) {
  const Icon = getNavIcon(item.sectionId)
  const label = useTranslatedNavLabel(item.sectionId, item.label)

  return (
    <a
      href={item.href}
      data-draft-target={`nav-link-${item.sectionId}`}
      onClick={(e) => {
        e.preventDefault()
        onNavigate(item.href)
      }}
      className="nav-glitch-link"
      aria-label={label}
      title={label}
    >
      <span className="nav-glitch-icon" aria-hidden>
        <Icon className="h-5 w-5" weight="regular" />
      </span>
      <span className="nav-glitch-label" aria-hidden data-text={label}>
        {label}
      </span>
    </a>
  )
}

function MobileNavLink({
  item,
  onNavigate,
  linkClass,
}: {
  item: NavLink
  onNavigate: (href: string) => void
  linkClass: string
}) {
  const Icon = getNavIcon(item.sectionId)
  const label = useTranslatedNavLabel(item.sectionId, item.label)

  return (
    <a
      href={item.href}
      data-draft-target={`nav-link-${item.sectionId}`}
      onClick={(e) => {
        e.preventDefault()
        onNavigate(item.href)
      }}
      className={`inline-flex min-h-[48px] items-center gap-3 ${linkClass}`}
    >
      <Icon className="h-5 w-5 shrink-0" weight="regular" aria-hidden />
      <span>{label}</span>
    </a>
  )
}

export function SiteNav({ links: initialLinks }: SiteNavProps) {
  const [open, setOpen] = useState(false)
  const [draftLinks, setDraftLinks] = useState<NavLink[] | null>(null)
  const baseLinks = useMemo(() => initialLinks ?? defaultNavLinks(), [initialLinks])
  const links = draftLinks ?? baseLinks
  const { scrollTo } = useLenisContext()
  const { t } = useLocale()

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

  const mobileLinkClass =
    'shrink-0 whitespace-nowrap text-[0.9375rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground hover-chromatic'

  return (
    <header
      className="fixed left-0 right-0 top-0 border-b border-border/60 bg-background/85 backdrop-blur-sm"
      style={{ zIndex: 'var(--z-nav)' as React.CSSProperties['zIndex'] }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-card md:gap-3">
        <Link
          href="/"
          aria-label="Zardonic – Home"
          className="relative z-10 flex h-10 shrink-0 items-center"
        >
          <Image
            src={LOGO_IMAGE}
            alt="Zardonic"
            width={120}
            height={40}
            className="h-9 w-auto max-h-9 max-w-[7.5rem] object-contain object-left brightness-110 sm:max-w-[8.5rem]"
            priority
          />
        </Link>

        <nav
          className="hidden min-w-0 flex-1 justify-end md:flex"
          aria-label={t('aria.mainNav')}
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          <div className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1">
            {links.map((item) => (
              <DesktopNavLink key={item.sectionId} item={item} onNavigate={navigateTo} />
            ))}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? t('aria.closeMenu') : t('aria.openMenu')}
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
      </div>

      {open ? (
        <nav
          className="flex max-h-[min(70vh,28rem)] flex-col gap-1 overflow-y-auto border-t border-border/60 bg-background/95 px-card py-3 md:hidden"
          aria-label={t('aria.mobileNav')}
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          {links.map((item) => (
            <MobileNavLink
              key={item.sectionId}
              item={item}
              onNavigate={navigateTo}
              linkClass={mobileLinkClass}
            />
          ))}
          <div className="mt-2 border-t border-border/40 pt-3 sm:hidden">
            <LanguageSwitcher />
          </div>
        </nav>
      ) : null}
    </header>
  )
}
