import { classifyReleaseType } from '@/lib/release-type'

export interface StreamingLink {
  platform: string
  url: string
}

export interface ReleaseTrackMetadata {
  title: string
  duration?: string
  artist?: string
  featuredArtists?: string[]
}

export interface ReleaseMetadata {
  title: string
  type: 'album' | 'ep' | 'single' | 'remix' | 'compilation' | ''
  release_date: string | null
  description: string | null
  artists: string[]
  coverUrl: string | null
  streaming_links: StreamingLink[]
  tracks?: ReleaseTrackMetadata[]
  itunes_id?: string | null
  spotify_id?: string | null
  discogs_id?: string | null
  /** Track count from the source, used for single/EP/album classification. */
  trackCount?: number | null
}

/**
 * @deprecated Use `classifyReleaseType` from `@/lib/release-type` directly.
 * Kept as a thin wrapper for callers that only have a title + hints.
 */
export function inferReleaseTypeFromTitle(title: string, hints: string[] = []): ReleaseMetadata['type'] {
  return classifyReleaseType({ title, hints })
}

export function mergeStreamingLinks(
  existing: StreamingLink[],
  incoming: StreamingLink[],
): StreamingLink[] {
  const map = new Map<string, StreamingLink>()
  for (const link of existing) {
    if (link.platform && link.url) map.set(link.platform, link)
  }
  for (const link of incoming) {
    if (link.platform && link.url) map.set(link.platform, link)
  }
  return Array.from(map.values())
}