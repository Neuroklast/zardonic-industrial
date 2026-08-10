import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

describe('createPublicClient', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    process.env.NODE_ENV = originalNodeEnv
  })

  it('returns a stub when env is missing in non-production', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    process.env.NODE_ENV = 'test'

    const { createPublicClient } = await import('@/lib/supabaseServer')
    const client = createPublicClient()
    const result = await client.from('gigs').select('id')
    expect(result.error).toBeNull()
    expect(result.data).toEqual([])
  })

  it('builds a real client when env is present', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    const { createPublicClient } = await import('@/lib/supabaseServer')
    const client = createPublicClient()
    // Cookie-less public client: no auth session helpers from @supabase/ssr cookies path
    expect(client).toBeTruthy()
    expect(typeof client.from).toBe('function')
  })
})
