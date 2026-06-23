import {
  normalizeDiscogsArtistId,
  normalizeItunesArtistId,
  normalizeSpotifyArtistId,
} from '@/lib/release-external-ids'

export interface CatalogueSyncConfig {
  artistName: string
  itunesArtistId: string
  spotifyArtistId: string
  discogsArtistId: string
}

export const DEFAULT_CATALOGUE_SYNC_CONFIG: CatalogueSyncConfig = {
  artistName: 'Zardonic',
  itunesArtistId: '',
  spotifyArtistId: '',
  discogsArtistId: '',
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** Parse and normalize catalogue sync settings from site_config JSON. */
export function parseCatalogueSyncConfig(value: unknown): CatalogueSyncConfig {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const artistName = readString(raw.artistName).trim() || DEFAULT_CATALOGUE_SYNC_CONFIG.artistName

  const itunesRaw = readString(raw.itunesArtistId)
  const spotifyRaw = readString(raw.spotifyArtistId)
  const discogsRaw = readString(raw.discogsArtistId)

  return {
    artistName,
    itunesArtistId: normalizeItunesArtistId(itunesRaw) ?? itunesRaw.trim(),
    spotifyArtistId: normalizeSpotifyArtistId(spotifyRaw) ?? spotifyRaw.trim(),
    discogsArtistId: normalizeDiscogsArtistId(discogsRaw) ?? discogsRaw.trim(),
  }
}