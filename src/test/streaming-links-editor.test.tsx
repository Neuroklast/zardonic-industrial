/**
 * Unit tests for StreamingLinksEditor component.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StreamingLinksEditor } from '@/app/admin/_components/StreamingLinksEditor'

describe('StreamingLinksEditor', () => {
  it('renders with no initial links', () => {
    render(<StreamingLinksEditor />)
    expect(screen.getByText('+ Add streaming link')).toBeTruthy()
  })

  it('renders existing links from initialJson', () => {
    const json = JSON.stringify([
      { platform: 'Spotify', url: 'https://open.spotify.com/artist/123' },
      { platform: 'Bandcamp', url: 'https://artist.bandcamp.com' },
    ])
    const { container } = render(<StreamingLinksEditor initialJson={json} />)
    // Platform inputs use a datalist (list attribute) so their ARIA role is "combobox"
    const platforms = container.querySelectorAll<HTMLInputElement>(
      'input[aria-label^="Streaming platform"]',
    )
    expect(platforms).toHaveLength(2)
    expect(platforms[0].value).toBe('Spotify')
    expect(platforms[1].value).toBe('Bandcamp')
  })

  it('adds a new empty link when "Add streaming link" is clicked', () => {
    render(<StreamingLinksEditor />)
    fireEvent.click(screen.getByText('+ Add streaming link'))
    const removeButtons = screen.getAllByRole('button', { name: /Remove streaming link/ })
    expect(removeButtons).toHaveLength(1)
  })

  it('removes a link when the remove button is clicked', () => {
    const json = JSON.stringify([{ platform: 'Spotify', url: 'https://spotify.com' }])
    render(<StreamingLinksEditor initialJson={json} />)
    fireEvent.click(screen.getByRole('button', { name: /Remove streaming link 1/ }))
    expect(screen.queryByRole('button', { name: /Remove streaming link/ })).toBeNull()
  })

  it('serialises valid links to hidden input', () => {
    const json = JSON.stringify([{ platform: 'Spotify', url: 'https://spotify.com/artist/1' }])
    const { container } = render(<StreamingLinksEditor initialJson={json} />)
    const hidden = container.querySelector('input[type="hidden"][name="streaming_links"]') as HTMLInputElement
    expect(hidden).toBeTruthy()
    const parsed = JSON.parse(hidden.value) as Array<{ platform: string; url: string }>
    expect(parsed).toHaveLength(1)
    expect(parsed[0].platform).toBe('Spotify')
  })

  it('excludes links with empty platform or url from hidden input', () => {
    const { container } = render(<StreamingLinksEditor />)
    // Add a link but leave it empty
    fireEvent.click(screen.getByText('+ Add streaming link'))
    const hidden = container.querySelector('input[type="hidden"][name="streaming_links"]') as HTMLInputElement
    const parsed = JSON.parse(hidden.value) as unknown[]
    expect(parsed).toHaveLength(0)
  })

  it('gracefully handles invalid initialJson', () => {
    render(<StreamingLinksEditor initialJson="not-json{{{" />)
    expect(screen.getByText('+ Add streaming link')).toBeTruthy()
  })
})
