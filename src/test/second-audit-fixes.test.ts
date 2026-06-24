/**
 * Second audit pass — RED tests for 6 concrete findings.
 * Run: npm run test -- --run src/test/second-audit-fixes.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Shared KV mock (all handlers share it) ───────────────────────────────────

const mockKvGet = vi.fn()
const mockKvSet = vi.fn()
const mockKvLrange = vi.fn().mockResolvedValue([])

vi.mock('@upstash/redis', () => ({
  Redis: class {
    get = mockKvGet
    set = mockKvSet
    lrange = mockKvLrange
  },
}))

vi.mock('../../api/_ratelimit.ts', () => ({
  applyRateLimit: vi.fn().mockResolvedValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  hashIp: vi.fn().mockReturnValue('hashed-ip'),
}))

vi.mock('../../api/auth.ts', () => ({
  validateSession: vi.fn().mockResolvedValue(false),
  isRedisConfigured: vi.fn().mockReturnValue(true),
}))

// Top-level imports (module-level await is valid for ES modules / Vitest)
const { default: contactHandler } = await import('../../api/contact.ts')

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Res = { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn>; setHeader: ReturnType<typeof vi.fn> }
function mockRes(): Res {
  const res = { status: vi.fn(), json: vi.fn(), end: vi.fn(), setHeader: vi.fn() } as Res
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  res.end.mockReturnValue(res)
  res.setHeader.mockReturnValue(res)
  return res
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 — contact.ts: XSS in Brevo email path
// ─────────────────────────────────────────────────────────────────────────────
describe('contact.ts — Brevo XSS fix', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token'
    delete process.env.RESEND_API_KEY // force Brevo path
    process.env.BREVO_API_KEY = 'brevo-test-key'
    process.env.CONTACT_EMAIL = 'admin@example.com'
    mockKvGet.mockResolvedValue([])
    mockKvSet.mockResolvedValue('OK')
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '',
      json: async () => ({}),
    } as unknown as Response)
  })

  afterEach(() => {
    delete process.env.BREVO_API_KEY
    delete process.env.CONTACT_EMAIL
    fetchSpy.mockRestore()
  })

  it('escapes HTML special chars in name, subject, message sent via Brevo', async () => {
    const res = mockRes()
    await contactHandler({
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.1' },
      body: {
        name: '<script>alert(1)</script>',
        email: 'x@y.com',
        subject: '<img src=x onerror=alert(2)>',
        message: '<b>bold</b> & "double" \'single\'',
      },
    } as any, res as any)

    const brevoCall = fetchSpy.mock.calls.find(
      ([url]: [string]) => typeof url === 'string' && /^https:\/\/api\.brevo\.com(?:\/|$)/.test(url),
    )
    expect(brevoCall, 'Brevo fetch must be called').toBeDefined()
    const body = JSON.parse(brevoCall![1]!.body as string) as { htmlContent: string }
    // Raw injection payloads must NOT appear
    expect(body.htmlContent).not.toContain('<script>')
    expect(body.htmlContent).not.toContain('<img src=x')
    expect(body.htmlContent).not.toContain('<b>bold</b>')
    // Properly escaped forms must appear
    expect(body.htmlContent).toContain('&lt;script&gt;')
    expect(body.htmlContent).toContain('&amp;')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2 — use-analytics.ts: useAnalytics calls unobserve not disconnect
// ─────────────────────────────────────────────────────────────────────────────
describe('useAnalytics — cleanup calls disconnect not unobserve', () => {
  it('calls observer.disconnect() on unmount (not just unobserve)', async () => {
    const { renderHook, cleanup } = await import('@testing-library/react')
    const { useAnalytics } = await import('@/hooks/use-analytics')

    const disconnectSpy = vi.fn()
    const unobserveSpy = vi.fn()
    const MockIO = vi.fn().mockImplementation(function (this: { observe: ReturnType<typeof vi.fn>; unobserve: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }) {
      this.observe = vi.fn()
      this.unobserve = unobserveSpy
      this.disconnect = disconnectSpy
    }) as unknown as typeof IntersectionObserver
    vi.stubGlobal('IntersectionObserver', MockIO)

    const div = document.createElement('div')
    div.id = 'test-analytics-section'
    document.body.appendChild(div)

    const { unmount } = renderHook(() => useAnalytics('test-analytics-section'))
    unmount()
    cleanup()

    expect(disconnectSpy).toHaveBeenCalledTimes(1)

    document.body.removeChild(div)
    vi.unstubAllGlobals()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3 — use-lazy-image.ts: Image onload setState after unmount
// ─────────────────────────────────────────────────────────────────────────────
describe('useLazyImage — no setState after unmount', () => {
  it('ignores image onload callback fired after component unmount', async () => {
    const { renderHook, cleanup, act } = await import('@testing-library/react')
    const { useLazyImage } = await import('@/hooks/use-lazy-image')

    let capturedOnload: (() => void) | null = null
    class MockImage {
      src = ''
      set onload(fn: () => void) { capturedOnload = fn }
      get onload() { return capturedOnload ?? (() => {}) }
    }
    vi.stubGlobal('Image', MockImage)

    // IO fires intersection immediately so imageSrc is updated and Image() is created
    const MockIO = vi.fn().mockImplementation((cb: IntersectionObserverCallback) => ({
      observe: (el: Element) => cb([{ isIntersecting: true, target: el } as IntersectionObserverEntry], {} as IntersectionObserver),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    }))
    vi.stubGlobal('IntersectionObserver', MockIO)

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { unmount } = renderHook(() =>
      useLazyImage({ src: 'https://example.com/img.jpg' }),
    )

    // Unmount before image finishes loading
    unmount()
    cleanup()

    // Fire onload after unmount — must not cause React warning
    act(() => { capturedOnload?.() })

    const errorMessages = consoleError.mock.calls.map((c) => String(c[0]))
    expect(errorMessages.some((m) => m.toLowerCase().includes('unmounted'))).toBe(false)

    consoleError.mockRestore()
    vi.unstubAllGlobals()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4 — newsletter.ts: Mailchimp dc guard (empty-string dc → bad URL)
// ─────────────────────────────────────────────────────────────────────────────
describe('newsletter.ts — Mailchimp dc guard', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token'
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
      status: 200,
    } as unknown as Response)
  })

  afterEach(() => {
    delete process.env.MAILCHIMP_API_KEY
    delete process.env.MAILCHIMP_LIST_ID
    fetchSpy.mockRestore()
  })

  it('does not build a Mailchimp URL when API key has no datacenter suffix', async () => {
    // Key with trailing dash → split('-').pop() = '' → bad URL "https://.api.mailchimp.com"
    process.env.MAILCHIMP_API_KEY = 'somekeywithoutsuffix-'
    process.env.MAILCHIMP_LIST_ID = 'list123'
    delete process.env.RESEND_API_KEY
    delete process.env.BREVO_API_KEY

    const { default: newsletterHandler } = await import('../../api/newsletter.ts')

    const res = mockRes()
    await newsletterHandler({
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.1' },
      body: { email: 'test@example.com' },
    } as any, res as any)

    const mailchimpCalls = fetchSpy.mock.calls.filter(
      ([url]: [string]) => typeof url === 'string' && /\.api\.mailchimp\.com\//.test(url),
    )
    // With an empty dc, the URL is "https://.api.mailchimp.com" which is invalid
    // After the fix, the handler should skip the Mailchimp call entirely when dc is empty
    const badUrls = mailchimpCalls.filter(([url]: [string]) =>
      typeof url === 'string' && /^https:\/\/\.api\.mailchimp\.com/.test(url),
    )
    expect(badUrls).toHaveLength(0)
    // Handler must return 500 to signal misconfiguration, not silently succeed
    expect(res.status.mock.calls[0]?.[0]).toBe(500)
  })
})
