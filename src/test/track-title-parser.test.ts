import { describe, it, expect } from 'vitest'
import { parseTrackTitle } from '../lib/track-parser'

describe('parseTrackTitle', () => {
  it('extracts "feat." correctly', () => {
    const result = parseTrackTitle("Song Name (feat. Artist B)")
    expect(result.cleanTitle).toBe("Song Name")
    expect(result.extractedArtists).toEqual(["Artist B"])
  })

  it('extracts "ft." correctly', () => {
    const result = parseTrackTitle("Song Name (ft. Artist C)")
    expect(result.cleanTitle).toBe("Song Name")
    expect(result.extractedArtists).toEqual(["Artist C"])
  })

  it('handles multiple artists separated by commas', () => {
    const result = parseTrackTitle("Song Name (feat. Artist B, Artist C)")
    expect(result.cleanTitle).toBe("Song Name")
    expect(result.extractedArtists).toEqual(["Artist B", "Artist C"])
  })

  it('handles multiple artists separated by & or and', () => {
    const result = parseTrackTitle("Song Name (feat. Artist B & Artist C and Artist D)")
    expect(result.cleanTitle).toBe("Song Name")
    expect(result.extractedArtists).toEqual(["Artist B", "Artist C", "Artist D"])
  })

  it('returns original title if no feat/ft found', () => {
    const result = parseTrackTitle("Song Name")
    expect(result.cleanTitle).toBe("Song Name")
    expect(result.extractedArtists).toEqual([])
  })

  it('handles case insensitive feat/ft', () => {
    const result = parseTrackTitle("Song Name (FEAT. Artist D)")
    expect(result.cleanTitle).toBe("Song Name")
    expect(result.extractedArtists).toEqual(["Artist D"])
  })
})
