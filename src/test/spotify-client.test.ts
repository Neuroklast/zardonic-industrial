import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api-secrets', () => ({ getApiSecret: vi.fn() }))

import { getApiSecret } from '@/lib/api-secrets'
import { getSpotifyAccessTokenDetailed } from '@/lib/spotify-client'

const getSecret = vi.mocked(getApiSecret)
const validId = 'a'.repeat(32)

describe('Spotify OAuth diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSecret.mockImplementation(async (key) =>
      key === 'spotify_client_id' ? validId : 'correctly-formed-secret',
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('identifies missing secrets', async () => {
    getSecret.mockResolvedValue(null)
    const result = await getSpotifyAccessTokenDetailed()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('not configured')
  })

  it('rejects a login email before contacting Spotify', async () => {
    getSecret.mockImplementation(async (key) =>
      key === 'spotify_client_id' ? 'info@zardonic.net' : 'secret',
    )
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const result = await getSpotifyAccessTokenDetailed()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('Invalid Spotify Client ID')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('distinguishes rejected client credentials', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    const result = await getSpotifyAccessTokenDetailed()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('rejected')
  })

  it('accepts a valid Spotify access token response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'token-for-test' }),
    }))
    const result = await getSpotifyAccessTokenDetailed()
    expect(result).toEqual({ ok: true, token: 'token-for-test' })
  })
})
