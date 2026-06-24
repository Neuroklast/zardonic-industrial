import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReleaseTracklistField } from '@/app/admin/_components/ReleaseTracklistField'

describe('ReleaseTracklistField', () => {
  it('renders row editor instead of raw JSON textarea', () => {
    render(
      <ReleaseTracklistField
        initialTracks={[
          { title: 'Opener', artist: 'Zardonic', duration: '4:12', featuredArtists: ['Guest'] },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: /add track/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/tracklist \(json\)/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/track 1 title/i)).toHaveValue('Opener')
    expect(screen.getByLabelText(/track 1 duration/i)).toHaveValue('4:12')
  })

  it('adds a new track row and serializes hidden JSON payload', () => {
    const { container } = render(<ReleaseTracklistField initialTracks={[]} />)

    fireEvent.change(screen.getByLabelText(/track 1 title/i), { target: { value: 'New Song' } })
    fireEvent.click(screen.getByRole('button', { name: /add track/i }))
    fireEvent.change(screen.getByLabelText(/track 2 title/i), { target: { value: 'Second' } })

    const hidden = container.querySelector('input[name="tracks"]') as HTMLInputElement
    expect(hidden).toBeTruthy()
    expect(JSON.parse(hidden.value)).toEqual([
      { title: 'New Song' },
      { title: 'Second' },
    ])
  })
})