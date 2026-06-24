import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { applySectionsDraft, parseSectionsDraft } from '@/lib/apply-sections-draft'

describe('parseSectionsDraft', () => {
  it('parses section entries and excludes legacy social ids', () => {
    const result = parseSectionsDraft({
      sections: [
        { id: 'bio', visible: true, order: 1 },
        { id: 'social', visible: true, order: 2 },
        { id: 'releases', visible: false, order: 0 },
      ],
    })

    expect(result).toEqual([
      { id: 'bio', visible: true, order: 1 },
      { id: 'releases', visible: false, order: 0 },
    ])
  })

  it('returns empty array for invalid payload', () => {
    expect(parseSectionsDraft({})).toEqual([])
    expect(parseSectionsDraft({ sections: 'nope' })).toEqual([])
  })
})

describe('applySectionsDraft', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    for (const id of ['hero', 'bio', 'releases']) {
      const el = document.createElement('div')
      el.setAttribute('data-draft-section', id)
      container.appendChild(el)
    }
  })

  afterEach(() => {
    container.remove()
  })

  it('updates headings and intros from draft payload', () => {
    const heading = document.createElement('h2')
    heading.setAttribute('data-draft-target', 'section-heading-bio')
    const intro = document.createElement('p')
    intro.setAttribute('data-draft-target', 'section-intro-bio')
    container.appendChild(heading)
    container.appendChild(intro)

    applySectionsDraft({
      sections: [{ id: 'bio', label: 'About Me', intro: 'The story so far.', visible: true, order: 0 }],
    })

    expect(heading.textContent).toContain('ABOUT ME')
    expect(intro.textContent).toBe('The story so far.')
  })

  it('updates nav link labels from section headings', () => {
    const navLink = document.createElement('a')
    navLink.setAttribute('data-draft-target', 'nav-link-bio')
    navLink.textContent = 'Bio'
    container.appendChild(navLink)

    applySectionsDraft({
      sections: [{ id: 'bio', label: 'About Me', visible: true, order: 0 }],
    })

    expect(navLink.textContent).toBe('About Me')
  })

  it('updates order and visibility on matching section shells', () => {
    applySectionsDraft({
      sections: [
        { id: 'releases', visible: true, order: 0 },
        { id: 'bio', visible: false, order: 1 },
        { id: 'hero', visible: true, order: 2 },
      ],
    })

    const hero = container.querySelector<HTMLElement>('[data-draft-section="hero"]')
    const bio = container.querySelector<HTMLElement>('[data-draft-section="bio"]')
    const releases = container.querySelector<HTMLElement>('[data-draft-section="releases"]')

    expect(releases?.style.order).toBe('0')
    expect(bio?.style.order).toBe('1')
    expect(bio?.style.display).toBe('none')
    expect(hero?.style.order).toBe('2')
    expect(hero?.style.display).toBe('')
  })
})