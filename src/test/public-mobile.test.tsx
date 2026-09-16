import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')

function readSource(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

describe('public mobile regression guards', () => {
  it('SiteNav hamburger has 44px touch target', () => {
    const src = readSource('app/_components/public/SiteNav.tsx')
    expect(src).toMatch(/min-h-\[44px\]/)
    expect(src).toMatch(/min-w-\[44px\]/)
  })

  it('SiteNav keeps logo in flex flow (not absolute over links)', () => {
    const src = readSource('app/_components/public/SiteNav.tsx')
    // Absolute logo + padding-left caused BIO to sit under the mark
    expect(src).not.toMatch(/absolute left-\[var\(--spacing-card/)
    expect(src).toMatch(/shrink-0/)
  })

  it('SiteNav uses icon→label glitch links on desktop', () => {
    const src = readSource('app/_components/public/SiteNav.tsx')
    expect(src).toMatch(/nav-glitch-link/)
    expect(src).toMatch(/getNavIcon/)
    // Translated label (i18n) used for accessible name
    expect(src).toMatch(/aria-label=\{label\}/)
  })

  it('GallerySection opens the shared CyberpunkOverlay lightbox', () => {
    const src = readSource('app/_components/public/GallerySection.tsx')
    expect(src).toMatch(/CyberpunkOverlay/)
    expect(src).toMatch(/type: 'gallery'/)
    expect(src).toMatch(/role=\{lightbox \? 'button' : undefined\}/)
  })

  it('CyberpunkOverlay exposes dialog semantics', () => {
    const src = readSource('components/CyberpunkOverlay.tsx')
    expect(src).toMatch(/role="dialog"/)
    expect(src).toMatch(/aria-modal="true"/)
    expect(src).toMatch(/GalleryOverlayContent/)
  })

  it('CyberpunkOverlay portals to document.body (viewport-fixed, immune to ancestor transforms)', () => {
    const src = readSource('components/CyberpunkOverlay.tsx')
    expect(src).toMatch(/createPortal/)
    expect(src).toMatch(/return createPortal\(/)
    expect(src).toMatch(/document\.body/)
    // An inline shell inside a `transform` / `filter` / `backdrop-filter`
    // ancestor (e.g. `.surface-section-panel`) makes `position: fixed`
    // resolve against that ancestor — modal off-center + unreachable content.
    expect(src).not.toMatch(/return \(\s*<AnimatePresence>/)
  })

  it('CyberpunkOverlay opts the modal out of Lenis wheel hijacking', () => {
    const src = readSource('components/CyberpunkOverlay.tsx')
    // Lenis preventDefaults wheel events while stopped (lenis.stop() on open);
    // `data-lenis-prevent` makes it bail out first so the modal can scroll.
    expect(src).toMatch(/data-lenis-prevent/)
  })

  it('Release tracklist is the only desktop scroll region', () => {
    const src = readSource('components/overlays/ReleaseOverlayContent.tsx')
    expect(src).toMatch(/data-lenis-prevent/)
    expect(src).toMatch(/md:flex-1 md:min-h-0 overflow-y-auto/)
  })

  it('SiteNav mobile links have 44px touch targets', () => {
    const src = readSource('app/_components/public/SiteNav.tsx')
    expect(src).toMatch(/min-h-\[44px\]/)
  })

  it('Gallery overlay dots are keyboard buttons', () => {
    const src = readSource('components/overlays/GalleryOverlayContent.tsx')
    expect(src).toMatch(/aria-label=\{`Go to image/)
    expect(src).toMatch(/type="button"/)
  })

  it('SiteFooter sanitizes legal links without stripping same-origin paths', () => {
    const src = readSource('app/_components/public/SiteFooter.tsx')
    expect(src).toMatch(/sanitizeHref\(legalNoticeUrl\)/)
    expect(src).toMatch(/sanitizeHref\(privacyPolicyUrl\)/)
    expect(src).not.toMatch(/sanitizeExternalHref\(legalNoticeUrl\)/)
    expect(src).not.toMatch(/sanitizeExternalHref\(privacyPolicyUrl\)/)
  })
})