/**
 * Spotify Web API page sizes.
 * Artist albums + search max 10 since Feb 2026 Dev Mode changes.
 * @see https://developer.spotify.com/documentation/web-api/reference/get-an-artists-albums
 */
export const SPOTIFY_ARTIST_ALBUMS_PAGE_LIMIT = 10
export const SPOTIFY_SEARCH_PAGE_LIMIT = 10
/** Album tracks endpoint still allows up to 50. */
export const SPOTIFY_ALBUM_TRACKS_PAGE_LIMIT = 50