import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReleaseOverlayContent } from '../components/overlays/ReleaseOverlayContent'
import type { Release } from '../lib/app-types'

const mockRelease: Release = {
  id: 'test-id',
  title: 'Test Release',
  releaseDate: '2023-01-01',
  type: 'album',
  artwork: "",
  year: "2023",
  tracks: [
    { title: 'Track 1 (feat. Guest Artist)', artist: 'Main Artist' },
    { title: 'Track 2', artist: 'Main Artist', featuredArtists: ['Another Guest'] },
    { title: 'Track 3', artist: 'Different Artist' }
  ]
}

describe('ReleaseOverlayContent Track Rendering', () => {
  it('extracts featured artists from title and renders them', () => {
    render(<ReleaseOverlayContent data={mockRelease} mainArtistName="Main Artist" />)

    // Track 1 should have clean title
    expect(screen.getByText('Track 1')).toBeInTheDocument()

    // And "Guest Artist" should be rendered
    expect(screen.getByText('Guest Artist')).toBeInTheDocument()

    // Main Artist shouldn't be duplicated if it's the main release artist
    // Note: The specific output of buildTrackArtistLine handles this
  })
})
