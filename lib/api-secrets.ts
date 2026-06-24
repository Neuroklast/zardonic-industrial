import { createAdminClient } from '@/lib/supabaseAdmin'
import {
  decryptSecret,
  encryptSecret,
  isSecretsEncryptionConfigured,
} from '@/lib/secrets-encryption'

export const API_SECRET_KEYS = [
  'spotify_client_id',
  'spotify_client_secret',
  'discogs_token',
  'bandsintown_api_key',
  'setlistfm_api_key',
  'google_drive_api_key',
  'google_client_id',
  'google_client_secret',
  'resend_api_key',
  'brevo_api_key',
  'mailchimp_api_key',
  'mailchimp_list_id',
  'brevo_list_id',
  'blob_read_write_token',
] as const

export type ApiSecretKey = (typeof API_SECRET_KEYS)[number]

export interface ApiSecretFieldDef {
  key: ApiSecretKey
  envVar: string
  label: string
  description?: string
  sensitive: boolean
}

export interface ApiSecretGroupDef {
  id: string
  label: string
  description?: string
  fields: readonly ApiSecretFieldDef[]
}

export const API_SECRET_GROUPS: readonly ApiSecretGroupDef[] = [
  {
    id: 'spotify',
    label: 'Spotify',
    description: 'Client credentials for catalogue sync and release enrichment.',
    fields: [
      {
        key: 'spotify_client_id',
        envVar: 'SPOTIFY_CLIENT_ID',
        label: 'Client ID',
        sensitive: false,
      },
      {
        key: 'spotify_client_secret',
        envVar: 'SPOTIFY_CLIENT_SECRET',
        label: 'Client Secret',
        sensitive: true,
      },
    ],
  },
  {
    id: 'discogs',
    label: 'Discogs',
    description: 'Personal access token for release metadata and catalogue sync.',
    fields: [
      {
        key: 'discogs_token',
        envVar: 'DISCOGS_TOKEN',
        label: 'Personal Access Token',
        sensitive: true,
      },
    ],
  },
  {
    id: 'bandsintown',
    label: 'Bandsintown',
    description: 'App ID for live event sync.',
    fields: [
      {
        key: 'bandsintown_api_key',
        envVar: 'BANDSINTOWN_API_KEY',
        label: 'App ID / API Key',
        sensitive: true,
      },
    ],
  },
  {
    id: 'setlistfm',
    label: 'Setlist.fm',
    description: 'API key for setlist lookups.',
    fields: [
      {
        key: 'setlistfm_api_key',
        envVar: 'SETLISTFM_API_KEY',
        label: 'API Key',
        sensitive: true,
      },
    ],
  },
  {
    id: 'google',
    label: 'Google',
    description: 'Drive API and OAuth credentials.',
    fields: [
      {
        key: 'google_drive_api_key',
        envVar: 'GOOGLE_DRIVE_API_KEY',
        label: 'Drive API Key',
        sensitive: true,
      },
      {
        key: 'google_client_id',
        envVar: 'GOOGLE_CLIENT_ID',
        label: 'OAuth Client ID',
        sensitive: false,
      },
      {
        key: 'google_client_secret',
        envVar: 'GOOGLE_CLIENT_SECRET',
        label: 'OAuth Client Secret',
        sensitive: true,
      },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Transactional email providers.',
    fields: [
      {
        key: 'resend_api_key',
        envVar: 'RESEND_API_KEY',
        label: 'Resend API Key',
        sensitive: true,
      },
      {
        key: 'brevo_api_key',
        envVar: 'BREVO_API_KEY',
        label: 'Brevo API Key',
        sensitive: true,
      },
    ],
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Mailing list provider credentials.',
    fields: [
      {
        key: 'mailchimp_api_key',
        envVar: 'MAILCHIMP_API_KEY',
        label: 'Mailchimp API Key',
        sensitive: true,
      },
      {
        key: 'mailchimp_list_id',
        envVar: 'MAILCHIMP_LIST_ID',
        label: 'Mailchimp List ID',
        sensitive: false,
      },
      {
        key: 'brevo_list_id',
        envVar: 'BREVO_LIST_ID',
        label: 'Brevo List ID',
        sensitive: false,
      },
    ],
  },
  {
    id: 'storage',
    label: 'Vercel Blob',
    description: 'Legacy CMS media upload token.',
    fields: [
      {
        key: 'blob_read_write_token',
        envVar: 'BLOB_READ_WRITE_TOKEN',
        label: 'Blob Read/Write Token',
        sensitive: true,
      },
    ],
  },
] as const

export const API_SECRET_FIELDS: readonly ApiSecretFieldDef[] = API_SECRET_GROUPS.flatMap(
  (group) => group.fields,
)

const FIELD_BY_KEY = new Map<ApiSecretKey, ApiSecretFieldDef>(
  API_SECRET_FIELDS.map((field) => [field.key, field]),
)

const VALID_KEYS = new Set<ApiSecretKey>(API_SECRET_FIELDS.map((field) => field.key))

interface CacheEntry {
  value: string | null
  expires: number
}

const CACHE_TTL_MS = 60_000
const cache = new Map<ApiSecretKey, CacheEntry>()

function getFieldDef(key: ApiSecretKey): ApiSecretFieldDef {
  const def = FIELD_BY_KEY.get(key)
  if (!def) throw new Error(`Unknown API secret key: ${key}`)
  return def
}

function readEnvFallback(key: ApiSecretKey): string | null {
  const envVar = getFieldDef(key).envVar
  const value = process.env[envVar]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function clearApiSecretsCache(): void {
  cache.clear()
}

export function isValidApiSecretKey(key: string): key is ApiSecretKey {
  return VALID_KEYS.has(key as ApiSecretKey)
}

/**
 * Returns whether a secret is configured (DB row or env fallback). Never returns the value.
 */
export async function isApiSecretConfigured(key: ApiSecretKey): Promise<boolean> {
  const status = await getApiSecretsStatus()
  return status[key] ?? false
}

export async function getApiSecretsStatus(): Promise<Record<ApiSecretKey, boolean>> {
  const status = {} as Record<ApiSecretKey, boolean>
  const dbKeys = new Set<string>()

  try {
    const supabase = createAdminClient()
    const { data } = await supabase.from('api_secrets').select('key')
    for (const row of data ?? []) {
      if (typeof row.key === 'string') dbKeys.add(row.key)
    }
  } catch {
    // Table may not exist yet — fall back to env only
  }

  for (const field of API_SECRET_FIELDS) {
    status[field.key] = dbKeys.has(field.key) || readEnvFallback(field.key) !== null
  }

  return status
}

/**
 * Resolve a secret: Supabase (decrypted) first, then env fallback.
 */
export async function getApiSecret(key: ApiSecretKey): Promise<string | null> {
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.value
  }

  let value: string | null = null

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('api_secrets')
      .select('encrypted_value')
      .eq('key', key)
      .maybeSingle()

    if (data?.encrypted_value && typeof data.encrypted_value === 'string') {
      if (isSecretsEncryptionConfigured()) {
        value = decryptSecret(data.encrypted_value)
      }
    }
  } catch {
    // Fall through to env
  }

  if (!value) {
    value = readEnvFallback(key)
  }

  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS })
  return value
}

export async function setApiSecret(key: ApiSecretKey, plaintext: string): Promise<void> {
  if (!isSecretsEncryptionConfigured()) {
    throw new Error('SECRETS_ENCRYPTION_KEY is not configured')
  }

  const trimmed = plaintext.trim()
  if (!trimmed) {
    throw new Error('Secret value cannot be empty')
  }

  const encrypted = encryptSecret(trimmed)
  const supabase = createAdminClient()
  const { error } = await supabase.from('api_secrets').upsert(
    {
      key,
      encrypted_value: encrypted,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  )

  if (error) throw new Error(error.message)
  cache.delete(key)
}

export async function deleteApiSecret(key: ApiSecretKey): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('api_secrets').delete().eq('key', key)
  if (error) throw new Error(error.message)
  cache.delete(key)
}

export interface SaveApiSecretsInput {
  values: Partial<Record<ApiSecretKey, string>>
  clearKeys: ApiSecretKey[]
}

export async function saveApiSecrets(input: SaveApiSecretsInput): Promise<void> {
  for (const key of input.clearKeys) {
    await deleteApiSecret(key)
  }

  for (const [rawKey, rawValue] of Object.entries(input.values)) {
    if (!isValidApiSecretKey(rawKey)) continue
    const value = typeof rawValue === 'string' ? rawValue.trim() : ''
    if (!value) continue
    await setApiSecret(rawKey, value)
  }
}