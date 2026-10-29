/**
 * Supabase OAuth authorization IDs are opaque values, not necessarily UUIDs.
 * Permit only bounded URL-safe characters; never rely on their format for auth.
 * The actual authorization is validated via Supabase Auth and the admin allowlist.
 */
export function isValidOAuthAuthorizationId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(value)
}
