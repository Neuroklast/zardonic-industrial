interface OdesliPlatformLink {
  url: string
  entityUniqueId: string
}

interface OdesliEntity {
  id: string
  type: string
  title?: string
  artistName?: string
  thumbnailUrl?: string
}

interface OdesliResponse {
  entityUniqueId: string
  linksByPlatform: {
    spotify?: OdesliPlatformLink
    appleMusic?: OdesliPlatformLink
    soundcloud?: OdesliPlatformLink
    youtube?: OdesliPlatformLink
    bandcamp?: OdesliPlatformLink
    deezer?: OdesliPlatformLink
    tidal?: OdesliPlatformLink
    amazon?: OdesliPlatformLink
    [key: string]: OdesliPlatformLink | undefined
  }
  entitiesByUniqueId: {
    [key: string]: OdesliEntity
  }
}

export interface OdesliResult {
  spotify?: string
  appleMusic?: string
  soundcloud?: string
  youtube?: string
  bandcamp?: string
  deezer?: string
  tidal?: string
  amazonMusic?: string
  artwork?: string
  entityType?: string
}

export async function fetchOdesliLinks(streamingUrl: string): Promise<OdesliResult | null> {
  try {
    const response = await fetch(
      `/api/odesli?url=${encodeURIComponent(streamingUrl)}&userCountry=DE`
    )

    if (!response.ok) {
      console.error('Odesli API call failed:', response.status)
      return null
    }

    const data: OdesliResponse = await response.json()
    const result: OdesliResult = {}

    if (data.linksByPlatform?.spotify) {
      result.spotify = data.linksByPlatform.spotify.url
    }
    if (data.linksByPlatform?.appleMusic) {
      result.appleMusic = data.linksByPlatform.appleMusic.url
    }
    if (data.linksByPlatform?.soundcloud) {
      result.soundcloud = data.linksByPlatform.soundcloud.url
    }
    if (data.linksByPlatform?.youtube) {
      result.youtube = data.linksByPlatform.youtube.url
    }
    if (data.linksByPlatform?.bandcamp) {
      result.bandcamp = data.linksByPlatform.bandcamp.url
    }
    if (data.linksByPlatform?.deezer) {
      result.deezer = data.linksByPlatform.deezer.url
    }
    if (data.linksByPlatform?.tidal) {
      result.tidal = data.linksByPlatform.tidal.url
    }
    if (data.linksByPlatform?.amazon) {
      result.amazonMusic = data.linksByPlatform.amazon.url
    }

    // Extract artwork and entity type from Odesli entity metadata
    if (data.entityUniqueId && data.entitiesByUniqueId) {
      const entity = data.entitiesByUniqueId[data.entityUniqueId]
      if (entity?.thumbnailUrl) {
        result.artwork = entity.thumbnailUrl
      }
      if (entity?.type) {
        result.entityType = entity.type
      }
    }

    return result
  } catch (error) {
    console.error('Error fetching Odesli links:', error)
    return null
  }
}
