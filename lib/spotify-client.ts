import { getApiSecret } from '@/lib/api-secrets'
import { isValidSpotifyClientId } from '@/lib/spotify-client-id'

export type SpotifyTokenResult =
  | { ok: true; token: string }
  | { ok: false; message: string }

/**
 * Validate server-side credentials against Spotify rather than treating any
 * non-200 OAuth response as "credentials missing".
 * Never return or log credentials or the provider's response body.
 */
export async function getSpotifyAccessTokenDetailed(): Promise<SpotifyTokenResult> {
  const [clientId, clientSecret] = await Promise.all([
    getApiSecret('spotify_client_id'),
    getApiSecret('spotify_client_secret'),
  ])

  if (!clientId || !clientSecret) {
    return { ok: false, message: 'Spotify API credentials are not configured. Set the Client ID and Client Secret under Admin → API Keys.' }
  }
  if (!isValidSpotifyClientId(clientId)) {
    return { ok: false, message: 'Invalid Spotify Client ID. Use the 32-character app ID from Spotify Developer Dashboard, not an email address.' }
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    if (res.status === 400 || res.status === 401) {
      return { ok: false, message: 'Spotify rejected the Client ID or Client Secret. Check the app credentials in Spotify Developer Dashboard.' }
    }
    if (res.status === 429) {
      return { ok: false, message: 'Spotify API rate limit reached. Try the import again later.' }
    }
    if (!res.ok) {
      return { ok: false, message: `Spotify OAuth service returned HTTP ${res.status}. Please retry.` }
    }

    const data = (await res.json()) as { access_token?: unknown }
    if (typeof data.access_token !== 'string' || !data.access_token) {
      return { ok: false, message: 'Spotify OAuth response did not contain an access token.' }
    }
    return { ok: true, token: data.access_token }
  } catch {
    return { ok: false, message: 'Could not reach Spotify OAuth service. Check connectivity and try again.' }
  }
}

/** Backwards-compatible token resolver for Spotify catalogue clients. */
export async function getSpotifyAccessToken(): Promise<string | null> {
  const result = await getSpotifyAccessTokenDetailed()
  return result.ok ? result.token : null
}
