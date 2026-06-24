'use client'

import { CookiePreferencesButton } from '@/components/CookieConsent'

interface SocialLink {
  id: string
  platform: string
  url: string
  label: string | null
}

interface SiteFooterProps {
  socialLinks: SocialLink[]
  legalNoticeUrl: string
  privacyPolicyUrl: string
}

function PlatformIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase()

  if (p.includes('youtube'))
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M23.5 6.19a3 3 0 0 0-2.11-2.12C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.39.57A3 3 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3 3 0 0 0 2.11 2.12C4.46 20.5 12 20.5 12 20.5s7.54 0 9.39-.57a3 3 0 0 0 2.11-2.12C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
      </svg>
    )

  if (p.includes('instagram'))
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    )

  if (p.includes('facebook'))
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )

  if (p.includes('twitter') || p.includes('x.com'))
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )

  if (p.includes('spotify'))
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    )

  if (p.includes('soundcloud'))
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M11.56 8.87V17h8.76C21.78 17 23 15.77 23 14.26c0-1.44-1.1-2.6-2.51-2.72-.27-2.35-2.2-4.18-4.56-4.18-.86 0-1.66.24-2.35.63-.35.2-.57.61-.57.95-.01-.01-.02-.01-.02-.01zM0 15c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm4.5 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm-2.6-3.1c.1 0 .2.01.3.02.36-1.2 1.47-2.07 2.79-2.07.7 0 1.33.24 1.83.64.35-1.97 2.09-3.46 4.18-3.46 1.55 0 2.91.82 3.67 2.05.31-.1.64-.16.98-.16 1.79 0 3.25 1.45 3.25 3.25 0 .2-.02.39-.06.58H1.9c-.04-.19-.06-.38-.06-.58C1.84 11.1 2.61 11.9 1.9 11.9z" />
      </svg>
    )

  if (p.includes('bandcamp'))
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M0 18.75l7.437-13.5H24l-7.438 13.5z" />
      </svg>
    )

  return (
    <span className="font-mono text-xs uppercase tracking-wider">{platform.slice(0, 2)}</span>
  )
}

export function SiteFooter({ socialLinks, legalNoticeUrl, privacyPolicyUrl }: SiteFooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer
      className="relative border-t border-border/60 py-8"
      style={{ zIndex: 'var(--z-content)' as React.CSSProperties['zIndex'] }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-card">
        {socialLinks.length > 0 ? (
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-5" aria-label="Social media links">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label={link.label ?? link.platform}
                title={link.label ?? link.platform}
              >
                <PlatformIcon platform={link.platform} />
              </a>
            ))}
          </nav>
        ) : null}

        <nav
          className="flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2"
          aria-label="Legal links"
        >
          <a
            href={legalNoticeUrl}
            data-draft-target="footer-legal"
            className="inline-flex min-h-[44px] items-center px-1 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Legal Notice
          </a>
          <span className="hidden text-border sm:inline" aria-hidden="true">
            ·
          </span>
          <a
            href={privacyPolicyUrl}
            data-draft-target="footer-privacy"
            className="inline-flex min-h-[44px] items-center px-1 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy Policy
          </a>
          <span className="hidden text-border sm:inline" aria-hidden="true">
            ·
          </span>
          <CookiePreferencesButton
            privacyPolicyUrl={privacyPolicyUrl}
            className="inline-flex min-h-[44px] items-center px-1 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          />
        </nav>

        <p className="text-center font-mono text-xs uppercase tracking-widest text-muted-foreground/80">
          © {year} Zardonic
        </p>
      </div>
    </footer>
  )
}