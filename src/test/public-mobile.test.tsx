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

  it('GallerySection supports lightbox interaction', () => {
    const src = readSource('app/_components/public/GallerySection.tsx')
    expect(src).toMatch(/SwipeableGallery/)
    expect(src).toMatch(/role=\{lightbox \? 'button' : undefined\}/)
  })

  it('CyberpunkOverlay exposes dialog semantics', () => {
    const src = readSource('components/CyberpunkOverlay.tsx')
    expect(src).toMatch(/role="dialog"/)
    expect(src).toMatch(/aria-modal="true"/)
  })

  it('SiteNav mobile links have 44px touch targets', () => {
    const src = readSource('app/_components/public/SiteNav.tsx')
    expect(src).toMatch(/min-h-\[44px\]/)
  })

  it('SwipeableGallery lightbox dots are keyboard buttons', () => {
    const src = readSource('components/SwipeableGallery.tsx')
    expect(src).toMatch(/aria-label=\{`Go to image/)
    expect(src).toMatch(/type="button"/)
  })
})