import { describe, it, expect, afterEach } from 'vitest'
import { resolveScrollTarget } from '@/lib/scroll-target'

describe('resolveScrollTarget', () => {
  let section: HTMLElement | null = null

  afterEach(() => {
    section?.remove()
    section = null
  })

  it('resolves bare section ids to HTMLElements', () => {
    section = document.createElement('section')
    section.id = 'releases'
    document.body.appendChild(section)

    expect(resolveScrollTarget('releases')).toBe(section)
  })

  it('prefixes unknown bare ids for Lenis querySelector', () => {
    expect(resolveScrollTarget('missing-section')).toBe('#missing-section')
  })

  it('passes through hash selectors and keywords', () => {
    expect(resolveScrollTarget('#bio')).toBe('#bio')
    expect(resolveScrollTarget('top')).toBe('top')
  })
})