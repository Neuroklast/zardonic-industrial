import { fireEvent, render, screen } from '@testing-library/react'
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

  it('embeds the original Bandzoogle signup page in a clipped footer viewport', () => {
    render(
      <LocaleProvider>
        <SiteFooter socialLinks={[]} legalNoticeUrl="/legal-notice" privacyPolicyUrl="/privacy-policy" />
      </LocaleProvider>,
    )

    const crop = screen.getByTestId('bandzoogle-mailing-list-crop')
    expect(crop).toHaveClass('overflow-hidden')
    expect(crop).toHaveStyle({ height: '92px' })

    const frame = screen.getByTitle('Join the official Zardonic mailing list')
    expect(frame).toHaveAttribute('src', 'https://zardonic.bandzoogle.com/')
    expect(frame).toHaveAttribute('loading', 'lazy')
    expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(screen.getByRole('link', { name: /open the zardonic mailing list directly/i }))
      .toHaveAttribute('href', 'https://zardonic.bandzoogle.com/')
  })

  it('scales the heading, email field and button together when the footer becomes narrower', () => {
    render(
      <LocaleProvider>
        <SiteFooter socialLinks={[]} legalNoticeUrl="/legal-notice" privacyPolicyUrl="/privacy-policy" />
      </LocaleProvider>,
    )

    const crop = screen.getByTestId('bandzoogle-mailing-list-crop')
    const frame = screen.getByTitle('Join the official Zardonic mailing list')

    let containerWidth = 320
    Object.defineProperty(crop, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: containerWidth }),
    })

    fireEvent.resize(window)
    const mobileScale = 320 / 356
    expect(parseFloat(crop.style.height)).toBeCloseTo(92 * mobileScale)
    expect(frame.style.transform).toBe(`translateX(-50%) scale(${mobileScale})`)
    expect(parseFloat(frame.style.top)).toBeCloseTo(-560 * mobileScale)
    expect(frame.style.transformOrigin).toBe('top center')

    containerWidth = 280
    fireEvent.resize(window)
    expect(parseFloat(crop.style.height)).toBeCloseTo(92 * 280 / 356)

    containerWidth = 800
    fireEvent.resize(window)
    expect(parseFloat(crop.style.height)).toBe(92)
    expect(frame.style.transform).toBe('translateX(-50%) scale(1)')
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
