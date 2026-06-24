import { getApiSecret } from '@/lib/api-secrets'

/**
 * Lightweight Spotify Client Credentials token fetch for server actions.
 */
export async function getSpotifyAccessToken(): Promise<string | null> {
  const [clientId, clientSecret] = await Promise.all([
    getApiSecret('spotify_client_id'),
    getApiSecret('spotify_client_secret'),
  ])
  if (!clientId || !clientSecret) return null

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!res.ok) return null
  const data = (await res.json()) as { access_token?: string }
  return data.access_token ?? null
}