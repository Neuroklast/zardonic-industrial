import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReleaseOverlayContent } from '../components/overlays/ReleaseOverlayContent'
import type { Release } from '../lib/app-types'

const mockRelease: Release = {
  id: 'test-id',
  title: 'Test Release',
  releaseDate: '2023-01-01',
  type: 'album',
  artwork: '',
  year: '2023',
  tracks: [
    { title: 'Track 1 (feat. Main Artist)', artist: 'Main Artist' },
    { title: 'Track 2', artist: 'Main Artist', featuredArtists: ['Main Artist', 'Guest'] },
    { title: 'Track 3', artist: 'Main Artist', featuredArtists: [] }
  ]
}

describe('ReleaseOverlayContent Track Rendering Dedup', () => {
  it('deduplicates Main Artist from track level rendering', () => {
    const { container } = render(<ReleaseOverlayContent data={mockRelease} mainArtistName="Main Artist" />)

    // Track 3 should only render the title, no artist line, because it's just the main artist.
    expect(screen.getByText('Track 3')).toBeInTheDocument()

    // We expect 1 instance of 'Main Artist' in the document (the main release artist at the top).
    // Let's verify by counting instances of 'Main Artist' text content.
    // The component renders mainArtistName at the top level, but not on track 3.
    // However, it's safer to query the list items.

    const items = container.querySelectorAll('li')
    expect(items.length).toBe(3)

    // Track 1: 'Track 1', artist line shouldn't be there because both trackArtist and extracted are 'Main Artist'
    expect(items[0].textContent).toContain('Track 1')
    expect(items[0].textContent).not.toContain('Main Artist')

    // Track 2: 'Track 2', artist line should be 'Main Artist, Guest'
    expect(items[1].textContent).toContain('Track 2')
    expect(items[1].textContent).toContain('Main Artist, Guest')

    // Track 3: 'Track 3', artist line should not be there
    expect(items[2].textContent).toContain('Track 3')
    expect(items[2].textContent).not.toContain('Main Artist')
  })
})
