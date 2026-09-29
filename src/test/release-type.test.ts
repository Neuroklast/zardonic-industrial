import { describe, expect, it } from 'vitest'
import {
  classifyReleaseType,
  displayReleaseType,
  hasArtistOnEveryTrack,
  toQuickSelectReleaseType,
  trustworthyDeclaredType,
} from '@/lib/release-type'
import { inferReleaseTypeFromTitle } from '@/lib/release-metadata'

describe('displayReleaseType', () => {
  it('groups single and ep under one label', () => {
    expect(displayReleaseType('single')).toBe('Single / EP')
    expect(displayReleaseType('ep')).toBe('Single / EP')
  })

  it('maps the remaining stored values', () => {
    expect(displayReleaseType('album')).toBe('Album')
    expect(displayReleaseType('remix')).toBe('Remix')
    expect(displayReleaseType('compilation')).toBe('Appears On')
  })
})

describe('toQuickSelectReleaseType', () => {
  it('folds single and ep into one bucket', () => {
    expect(toQuickSelectReleaseType('single')).toBe('single')
    expect(toQuickSelectReleaseType('ep')).toBe('single')
  })

  it('maps the other stored values', () => {
    expect(toQuickSelectReleaseType('remix')).toBe('remix')
    expect(toQuickSelectReleaseType('album')).toBe('album')
    expect(toQuickSelectReleaseType('compilation')).toBe('compilation')
  })

  it('returns null for empty or unknown values', () => {
    expect(toQuickSelectReleaseType('')).toBeNull()
    expect(toQuickSelectReleaseType(null)).toBeNull()
    expect(toQuickSelectReleaseType(undefined)).toBeNull()
    expect(toQuickSelectReleaseType('bogus')).toBeNull()
  })
})

describe('trustworthyDeclaredType', () => {
  it('rejects Apple\'s always-"Album" collectionType', () => {
    expect(trustworthyDeclaredType('Album')).toBeNull()
    expect(trustworthyDeclaredType('album')).toBeNull()
    expect(trustworthyDeclaredType(undefined)).toBeNull()
  })

  it('keeps specific values', () => {
    expect(trustworthyDeclaredType('Single')).toBe('Single')
    expect(trustworthyDeclaredType('EP')).toBe('EP')
    expect(trustworthyDeclaredType('Compilation')).toBe('Compilation')
  })
})

describe('classifyReleaseType — semantic title markers win', () => {
  it('treats a remix title as remix even when Apple says Single', () => {
    expect(classifyReleaseType({ title: 'Higher (Zardonic Remix) - Single', trackCount: 1 })).toBe(
      'remix',
    )
  })

  it('detects remix collections with many tracks', () => {
    expect(classifyReleaseType({ title: 'The Become Remix Album', trackCount: 14 })).toBe('remix')
    expect(classifyReleaseType({ title: 'Restless (Remixes) - EP', trackCount: 6 })).toBe('remix')
  })

  it('detects the RMX abbreviation', () => {
    expect(classifyReleaseType({ title: 'Kernel Breaker RMX' })).toBe('remix')
  })

  it('detects compilations by title', () => {
    expect(classifyReleaseType({ title: 'Best Of Zardonic', trackCount: 20 })).toBe('compilation')
    expect(classifyReleaseType({ title: 'Greatest Hits' })).toBe('compilation')
    expect(classifyReleaseType({ title: 'B-Sides Compilation' })).toBe('compilation')
  })
})

describe('classifyReleaseType — declared type and Apple suffix', () => {
  it('uses a trustworthy declared type', () => {
    expect(classifyReleaseType({ title: 'Whatever', declaredType: 'Compilation' })).toBe(
      'compilation',
    )
    expect(classifyReleaseType({ title: 'Whatever', declaredType: 'EP' })).toBe('ep')
    expect(classifyReleaseType({ title: 'Whatever', declaredType: 'Album' })).toBe('album')
  })

  it('reads Apple trailing suffixes', () => {
    expect(classifyReleaseType({ title: 'Bitter (feat. Reebz) - Single', trackCount: 1 })).toBe(
      'single',
    )
    expect(classifyReleaseType({ title: 'Phoenix Down - EP', trackCount: 5 })).toBe('ep')
    expect(classifyReleaseType({ title: 'Foo - Compilation', trackCount: 30 })).toBe('compilation')
  })

  it('reads parenthetical markers', () => {
    expect(classifyReleaseType({ title: 'Foo (EP)', trackCount: 8 })).toBe('ep')
  })
})

describe('classifyReleaseType — track counts', () => {
  it('classifies by track count when nothing else applies', () => {
    expect(classifyReleaseType({ title: 'Superstars', trackCount: 12 })).toBe('album')
    expect(classifyReleaseType({ title: 'One Track', trackCount: 1 })).toBe('single')
    expect(classifyReleaseType({ title: 'Short Player', trackCount: 5 })).toBe('ep')
  })

  it('treats a bare EP token as explicit', () => {
    expect(classifyReleaseType({ title: 'Deep EP', trackCount: 9 })).toBe('ep')
  })
})

describe('classifyReleaseType — word boundaries', () => {
  it('does not treat "The Epic" as an EP', () => {
    expect(classifyReleaseType({ title: 'The Epic', trackCount: 11 })).toBe('album')
  })

  it('does not treat "Deep Space" as an EP', () => {
    expect(classifyReleaseType({ title: 'Deep Space', trackCount: 9 })).toBe('album')
  })

  it('does not let a bare "Single" token beat a real track count', () => {
    expect(classifyReleaseType({ title: 'Single Ladies', trackCount: 10 })).toBe('album')
    expect(classifyReleaseType({ title: 'Singles Collection', trackCount: null })).toBe('single')
  })
})

describe('classifyReleaseType — Spotify semantics', () => {
  it('splits Spotify singles from EPs via track count', () => {
    expect(classifyReleaseType({ title: 'Some Track', declaredType: null, trackCount: 1 })).toBe(
      'single',
    )
    expect(classifyReleaseType({ title: 'Some EP', declaredType: null, trackCount: 5 })).toBe('ep')
  })

  it('falls back to album when nothing is known', () => {
    expect(classifyReleaseType({ title: '' })).toBe('album')
    expect(classifyReleaseType({ title: 'Mystery' })).toBe('album')
  })
})

describe('hasArtistOnEveryTrack', () => {
  it('returns null without per-track artist data', () => {
    expect(hasArtistOnEveryTrack(null)).toBeNull()
    expect(hasArtistOnEveryTrack([])).toBeNull()
  })

  it('detects a shared artist and a various-artists set', () => {
    expect(hasArtistOnEveryTrack(['Zardonic', 'Zardonic, Guest'])).toBe(true)
    expect(hasArtistOnEveryTrack(['Alpha', 'Beta'])).toBe(false)
  })
})

describe('classifyReleaseType — Appears On vs Album artist rule', () => {
  const primaryArtist = 'Zardonic'

  it('is an album when one artist is credited on every track', () => {
    const trackArtists = Array.from({ length: 8 }, () => 'Zardonic, Some Guest')
    expect(
      classifyReleaseType({ title: 'Anthems', trackCount: 8, trackArtists, primaryArtist }),
    ).toBe('album')
  })

  it('is Appears On when many different artists share no common credit', () => {
    const trackArtists = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta']
    expect(classifyReleaseType({ title: 'Label Sampler', trackCount: 8, trackArtists })).toBe(
      'compilation',
    )
  })

  it('falls back to the release artist when a track lists none', () => {
    const trackArtists = Array.from({ length: 9 }, () => null)
    expect(classifyReleaseType({ title: 'Album', trackCount: 9, trackArtists, primaryArtist })).toBe(
      'album',
    )
  })

  it('stays an album when only a couple of distinct artists appear', () => {
    const trackArtists = [null, null, null, null, null, null, 'Someone Else']
    expect(
      classifyReleaseType({ title: 'Album With Guest', trackCount: 7, trackArtists, primaryArtist }),
    ).toBe('album')
  })

  it('ignores the artist rule below the track threshold', () => {
    const trackArtists = ['Alpha', 'Beta', 'Gamma']
    expect(classifyReleaseType({ title: 'Sampler', trackCount: 3, trackArtists })).toBe('ep')
  })

  it('keeps remix authoritative over the artist rule', () => {
    const trackArtists = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']
    expect(classifyReleaseType({ title: 'Remixes', trackCount: 6, trackArtists })).toBe('remix')
  })
})

describe('inferReleaseTypeFromTitle (deprecated wrapper)', () => {
  it('delegates to the canonical classifier', () => {
    expect(inferReleaseTypeFromTitle('Foo - EP')).toBe('ep')
    expect(inferReleaseTypeFromTitle('Zardonic Remix')).toBe('remix')
    expect(inferReleaseTypeFromTitle('Plain Album', ['Compilation'])).toBe('compilation')
  })
})
