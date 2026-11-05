import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteFooter } from '@/app/_components/public/SiteFooter'
import { LocaleProvider } from '@/contexts/LocaleContext'

describe('SiteFooter legal links', () => {
  it('keeps same-origin Legal Notice and Privacy Policy hrefs clickable', () => {
    render(
      <LocaleProvider>
        <SiteFooter
          socialLinks={[]}
          legalNoticeUrl="/legal-notice"
          privacyPolicyUrl="/privacy-policy"
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('link', { name: /legal notice/i })).toHaveAttribute('href', '/legal-notice')
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy-policy')
  })

  it('links to the real Bandzoogle signup because the provider blocks iframes', () => {
    render(
      <LocaleProvider>
        <SiteFooter socialLinks={[]} legalNoticeUrl="/legal-notice" privacyPolicyUrl="/privacy-policy" />
      </LocaleProvider>,
    )

    const signup = screen.getByRole('link', { name: /join the official zardonic mailing list/i })
    expect(signup).toHaveAttribute('href', 'https://zardonic.bandzoogle.com/')
    expect(signup).toHaveAttribute('target', '_blank')
    expect(signup).toHaveAttribute('rel', 'noopener noreferrer')
    expect(signup).toHaveClass('min-h-[44px]')
    expect(screen.queryByTitle('Join the official Zardonic mailing list')).not.toBeInTheDocument()
  })

  it('strips javascript: legal URLs instead of rendering them', () => {
    render(
      <LocaleProvider>
        <SiteFooter
          socialLinks={[]}
          legalNoticeUrl="javascript:alert(1)"
          privacyPolicyUrl="javascript:alert(1)"
        />
      </LocaleProvider>,
    )

    expect(screen.queryByRole('link', { name: /legal notice/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /privacy policy/i })).not.toBeInTheDocument()
  })
})
