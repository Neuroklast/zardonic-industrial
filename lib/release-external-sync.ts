import { fetchReleaseMetadataFromDiscogs } from '@/lib/discogs-sync'
import { fetchItunesItemById, parseItunesItem } from '@/lib/itunes-sync'
import {
  mergeStreamingLinks,
  type ReleaseMetadata,
  type StreamingLink,
} from '@/lib/release-metadata'
import {
  normalizeExternalId,
  type ExternalReleaseSource,
} from '@/lib/release-external-ids'
import { fetchReleaseMetadataFromSpotify } from '@/lib/spotify-sync'

export async function fetchReleaseMetadataByExternalId(
  source: ExternalReleaseSource,
  rawId: string,
): Promise<ReleaseMetadata | null> {
  const normalized = normalizeExternalId(source, rawId)
  if (!normalized) return null

  switch (source) {
    case 'itunes': {
      const item = await fetchItunesItemById(normalized)
      if (!item) return null
      const parsed = parseItunesItem(item)
      if (!parsed) return null
      return {
        title: parsed.title,
        type: parsed.type as ReleaseMetadata['type'],
        release_date: parsed.release_date,
        description: null,
        artists: [],
        coverUrl: parsed.artworkUrl,
        streaming_links: [
          {
            platform: 'appleMusic',
            url: `https://music.apple.com/album/id${parsed.itunes_id}`,
          },
        ],
        itunes_id: parsed.itunes_id,
      }
    }
    case 'spotify':
      return fetchReleaseMetadataFromSpotify(normalized)
    case 'discogs':
      return fetchReleaseMetadataFromDiscogs(normalized)
    default:
      return null
  }
}

export function buildReleaseUpdateFromMetadata(
  metadata: ReleaseMetadata,
  existingLinks: StreamingLink[],
  source: ExternalReleaseSource,
): Record<string, unknown> {
  const update: Record<string, unknown> = {
    title: metadata.title,
    type: metadata.type || 'album',
    release_date: metadata.release_date,
    artists: metadata.artists,
    streaming_links: mergeStreamingLinks(existingLinks, metadata.streaming_links),
  }

  if (metadata.tracks && metadata.tracks.length > 0) {
    update.tracks = metadata.tracks
  }

  if (metadata.description) update.description = metadata.description
  if (metadata.itunes_id) update.itunes_id = metadata.itunes_id
  if (metadata.spotify_id) update.spotify_id = metadata.spotify_id
  if (metadata.discogs_id) update.discogs_id = metadata.discogs_id

  if (source === 'itunes' && metadata.itunes_id) update.itunes_id = metadata.itunes_id
  if (source === 'spotify' && metadata.spotify_id) update.spotify_id = metadata.spotify_id
  if (source === 'discogs' && metadata.discogs_id) update.discogs_id = metadata.discogs_id

  return update
}