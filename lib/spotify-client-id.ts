/** Spotify application IDs are 32-character alphanumeric identifiers, not login emails. */
export function isValidSpotifyClientId(value: string): boolean {
  return /^[a-zA-Z0-9]{32}$/.test(value.trim())
}
