'use client'

/**
 * Bandzoogle sends frame-ancestors 'self', so framing its website from
 * zardonic.net is blocked by the browser regardless of our own CSP.
 * Open the real provider-managed signup in a new tab instead of showing
 * a blank, inaccessible iframe. Subscriptions remain in Bandzoogle.
 */
const BANDZOOGLE_URL = 'https://zardonic.bandzoogle.com/'

export function BandzoogleMailingListEmbed() {
  return (
    <div className="flex w-full max-w-[356px] flex-col items-center gap-3 text-center">
      <a
        href={BANDZOOGLE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] w-full items-center justify-center border border-primary/60 px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Join the official Zardonic mailing list on Bandzoogle (opens in new tab)"
        data-testid="bandzoogle-mailing-list-link"
      >
        Join the mailing list
      </a>
    </div>
  )
}
