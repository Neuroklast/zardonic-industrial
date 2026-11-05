'use client'

import { useEffect, useState } from 'react'
import { LinkSimple } from '@phosphor-icons/react'
import { resolveBrandMark } from '@/lib/social-brand-icons'
import { CookiePreferencesButton } from '@/components/CookieConsent'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLocale } from '@/contexts/LocaleContext'
import { sanitizeExternalHref, sanitizeHref } from '@/lib/sanitize-href'
import { BandzoogleMailingListEmbed } from './BandzoogleMailingListEmbed'

interface SocialLink {
  id: string
  platform: string
  url: string
  label: string | null
  logoUrl?: string | null
}

interface SiteFooterProps {
  socialLinks: SocialLink[]
  legalNoticeUrl: string
  privacyPolicyUrl: string
}

function PlatformIcon({ platform }: { platform: string }) {
  const brand = resolveBrandMark(platform)
  if (!brand) return <LinkSimple className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />

  return (
    <svg viewBox={brand.viewBox} fill="currentColor" className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true">
      <path d={brand.path} />
    </svg>
  )
}

/** Existing uploaded logos stay usable, but are painted with the active theme colour.
 * The same-origin proxy removes opaque plates before the browser uses the PNG as a mask.
 */
function ThemeLogo({ logoUrl }: { logoUrl: string }) {
  const safeUrl = sanitizeExternalHref(logoUrl)
  const maskUrl = safeUrl ? `/api/partner-logo?white=1&url=${encodeURIComponent(safeUrl)}` : null
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!maskUrl) return
    let mounted = true
    const probe = new Image()
    probe.onload = () => { if (mounted) setLoaded(true) }
    probe.onerror = () => { if (mounted) setLoaded(false) }
    probe.src = maskUrl
    return () => { mounted = false }
  }, [maskUrl])

  if (!maskUrl || !loaded) return <LinkSimple className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />

  return (
    <span
      aria-hidden="true"
      className="inline-block h-7 w-7 shrink-0 bg-current sm:h-8 sm:w-8"
      style={{
        maskImage: `url("${maskUrl}")`,
        WebkitMaskImage: `url("${maskUrl}")`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    />
  )
}

const footerLinkClass =
  'inline-flex min-h-[44px] items-center px-1 font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground sm:text-base sm:tracking-[0.18em]'

export function SiteFooter({ socialLinks, legalNoticeUrl, privacyPolicyUrl }: SiteFooterProps) {
  const year = new Date().getFullYear()
  const { t } = useLocale()

  return (
    <footer
      className="relative border-t border-border/60 py-10 sm:py-12"
      style={{ zIndex: 'var(--z-content)' as React.CSSProperties['zIndex'] }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-7 px-card sm:gap-8">
        <LanguageSwitcher />

        {socialLinks.length > 0 ? (
          <nav
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-5"
            aria-label={t('footer.socialNav')}
          >
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={sanitizeExternalHref(link.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center text-primary transition-colors hover:text-foreground"
                aria-label={link.label ?? link.platform}
                title={link.label ?? link.platform}
              >
                {link.logoUrl ? (
                  <ThemeLogo logoUrl={link.logoUrl} />
                ) : (
                  <PlatformIcon platform={link.platform} />
                )}
              </a>
            ))}
          </nav>
        ) : null}

        <BandzoogleMailingListEmbed />

        <nav
          className="flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-5"
          aria-label={t('footer.legalNav')}
        >
          <a href={sanitizeHref(legalNoticeUrl)} data-draft-target="footer-legal" className={footerLinkClass}>
            {t('footer.legal')}
          </a>
          <span className="hidden text-border sm:inline" aria-hidden="true">
            ·
          </span>
          <a href={sanitizeHref(privacyPolicyUrl)} data-draft-target="footer-privacy" className={footerLinkClass}>
            {t('footer.privacy')}
          </a>
          <span className="hidden text-border sm:inline" aria-hidden="true">
            ·
          </span>
          <CookiePreferencesButton
            privacyPolicyUrl={privacyPolicyUrl}
            className={footerLinkClass}
          />
        </nav>

        <p className="text-center font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground/85 sm:text-base sm:tracking-[0.18em]">
          {t('footer.copyrightLine').replace('{0}', String(year))}
        </p>
      </div>
    </footer>
  )
}
