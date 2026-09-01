import type { ExternalReleaseSource } from '@/lib/release-external-ids'

export interface ReleaseCoverFields {
  cover_storage_path?: string | null
  cover_url?: string | null
}

/**
 * Automatic imports may persist artwork from iTunes, Spotify or Discogs.
 * Priority is applied later (iTunes > Spotify > Discogs) when consolidating.
 */
export function shouldImportCoverFromSource(source: ExternalReleaseSource): boolean {
  return source === 'itunes' || source === 'spotify' || source === 'discogs'
}

export function isItunesSourcedCover(row: ReleaseCoverFields): boolean {
  const path = row.cover_storage_path?.trim().toLowerCase() ?? ''
  if (path.includes('itunes-')) return true
  if (path.startsWith('releases/covers/')) return true

  const url = row.cover_url?.trim().toLowerCase() ?? ''
  return url.includes('mzstatic.com')
}

export function isSpotifySourcedCover(row: ReleaseCoverFields): boolean {
  const path = row.cover_storage_path?.trim().toLowerCase() ?? ''
  if (path.includes('spotify-')) return true

  const url = row.cover_url?.trim().toLowerCase() ?? ''
  return url.includes('scdn.co') || url.includes('spotifycdn.com') || url.includes('i.scdn.co')
}

export function isDiscogsSourcedCover(row: ReleaseCoverFields): boolean {
  const path = row.cover_storage_path?.trim().toLowerCase() ?? ''
  if (path.includes('discogs-')) return true

  const url = row.cover_url?.trim().toLowerCase() ?? ''
  return url.includes('i.discogs.com')
}

export function hasCoverArt(row: ReleaseCoverFields): boolean {
  return Boolean(row.cover_storage_path?.trim() || row.cover_url?.trim())
}

/** Higher score = preferred canonical cover when consolidating duplicates. */
export function coverSourceScore(row: ReleaseCoverFields): number {
  if (!hasCoverArt(row)) return -1
  if (isItunesSourcedCover(row)) return 100
  if (isSpotifySourcedCover(row)) return 60
  if (isDiscogsSourcedCover(row)) return 40
  return 20
}

export interface MergedCoverResult {
  update: Partial<ReleaseCoverFields> | null
  discardPaths: string[]
}

/**
 * Decide which cover to keep when merging two release rows.
 * iTunes always wins over Spotify/Discogs; a lower-priority cover is adopted
 * onto a no-cover canonical; the losing cover's R2 object is discarded.
 */
export function resolveMergedCoverUpdate(
  canonical: ReleaseCoverFields,
  duplicate: ReleaseCoverFields,
): MergedCoverResult {
  const discardPaths: string[] = []
  const canonicalScore = coverSourceScore(canonical)
  const duplicateScore = coverSourceScore(duplicate)

  if (!hasCoverArt(duplicate)) {
    return { update: null, discardPaths }
  }

  if (duplicateScore > canonicalScore) {
    const canonicalPath = canonical.cover_storage_path?.trim()
    if (canonicalPath && canonicalPath !== duplicate.cover_storage_path?.trim()) {
      discardPaths.push(canonicalPath)
    }
    return {
      update: {
        cover_storage_path: duplicate.cover_storage_path ?? null,
        cover_url: duplicate.cover_url ?? null,
      },
      discardPaths,
    }
  }

  const duplicatePath = duplicate.cover_storage_path?.trim()
  if (duplicatePath) discardPaths.push(duplicatePath)

  return { update: null, discardPaths }
}
