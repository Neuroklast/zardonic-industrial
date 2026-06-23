/**
 * Client-side helper to fetch environment variable status from /api/env-check.
 *
 * Returns a record mapping variable names to their presence (boolean).
 * Falls back to all-false on network or parse errors so the wizard can
 * still render a helpful "could not verify" state.
 */

export interface EnvStatus {
  // Current primary backend (Supabase)
  NEXT_PUBLIC_SUPABASE_URL: boolean
  NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean
  SUPABASE_SERVICE_ROLE_KEY: boolean
  // Optional / legacy from migration
  RESEND_API_KEY: boolean
  R2_PUBLIC_HOST: boolean
}

export const REQUIRED_ENV_VARS: { key: keyof EnvStatus; label: string; description: string; required: boolean }[] = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', description: 'Supabase project URL (public + anon key required for data)', required: true },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key', description: 'Supabase anon/public key', required: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role', description: 'Service role key for admin operations and profile bootstrap', required: true },
  { key: 'RESEND_API_KEY', label: 'Resend API Key', description: 'API key for contact form email (optional)', required: false },
  { key: 'R2_PUBLIC_HOST', label: 'R2 Public Host', description: 'Cloudflare R2 public host for media (optional but recommended)', required: false },
]

const EMPTY_STATUS: EnvStatus = {
  UPSTASH_REDIS_REST_URL: false,
  UPSTASH_REDIS_REST_TOKEN: false,
  ADMIN_SETUP_TOKEN: false,
  RESEND_API_KEY: false,
}

export async function fetchEnvStatus(): Promise<EnvStatus> {
  try {
    const res = await fetch('/api/env-check')
    if (!res.ok) return EMPTY_STATUS
    const data = await res.json()
    return data?.vars ?? EMPTY_STATUS
  } catch {
    return EMPTY_STATUS
  }
}

/** Returns true when all required env vars are set. */
export function allRequiredSet(status: EnvStatus): boolean {
  return REQUIRED_ENV_VARS.filter((v) => v.required).every((v) => status[v.key])
}
