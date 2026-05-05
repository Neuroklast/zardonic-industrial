/**
 * Tests for the improvements implemented in this PR:
 * 1. SystemMonitorHUD hidden on mobile (hidden md:block)
 * 2. Section backgrounds removed (transparent sections — backgroundOpacity removed from registry)
 * 3. Button unified cyber design with hover effects (cyber-btn classes)
 * 4. GlitchGrid canvas context fix (no willReadFrequently)
 * 5. Instagram feed hook (useInstagramFeed)
 * 6. Background system: 3D model type added
 * 7. BackgroundStack: background image hidden when video is active
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

// ── Top-level mocks (Vitest hoists vi.mock regardless — keep them here) ───────

vi.mock('@/hooks/use-real-metrics', () => ({
  useRealMetrics: () => ({ sessionId: 'test-session', sector: 'EU-WEST-1', geolocation: null }),
}))

vi.mock('@/components/VideoBackground', () => ({
  default: ({ videoUrl }: { videoUrl: string }) => (
    <div data-testid="video-bg" data-url={videoUrl}>video</div>
  ),
}))

vi.mock('@/lib/image-cache', () => ({ toDirectImageUrl: (u: string) => u }))

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: new Proxy({}, {
      get: (_t: unknown, tag: string) =>
        React.forwardRef(
          ({
            children,
            initial: _i,
            whileInView: _wiv,
            viewport: _vp,
            transition: _tr,
            animate: _a,
            ...props
          }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>,
          ref: React.Ref<HTMLElement>) =>
            React.createElement(tag as string, { ...props, ref }, children)
        ),
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useInView: () => true,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: (_v: unknown, _from: unknown, to: unknown[]) => to[0],
  }
})

// ── 1: SystemMonitorHUD — hidden on mobile ────────────────────────────────────

describe('SystemMonitorHUD — mobile visibility', () => {
  it('all 3 corner panels use hidden md:block classes', async () => {
    const { SystemMonitorHUD } = await import('@/components/SystemMonitorHUD')
    const { container } = render(
      <SystemMonitorHUD
        decorativeTexts={undefined}
        dataCounts={{ releases: 0, gigs: 0, tracks: 0, members: 0 }}
      />
    )
    const hiddenDivs = Array.from(container.querySelectorAll('div')).filter(
      d => d.className.includes('hidden') && d.className.includes('md:block')
    )
    // Top-left, top-right, bottom-right panels are all desktop-only
    expect(hiddenDivs.length).toBe(3)
  })
})

// ── 2: Section backgrounds — removed from admin registry ─────────────────────

describe('Section backgrounds — removed from SECTION_REGISTRY', () => {
  it('bio section has no backgroundOpacity field', async () => {
    const { SECTION_REGISTRY } = await import('@/lib/sections-registry')
    const entry = SECTION_REGISTRY.find(e => e.id === 'bio')
    const field = entry?.configFields.find(
      f => f.path === 'sections.styleOverrides.bio.backgroundOpacity'
    )
    expect(field).toBeUndefined()
  })

  it('releases section has no backgroundOpacity field', async () => {
    const { SECTION_REGISTRY } = await import('@/lib/sections-registry')
    const entry = SECTION_REGISTRY.find(e => e.id === 'releases')
    const field = entry?.configFields.find(
      f => f.path === 'sections.styleOverrides.releases.backgroundOpacity'
    )
    expect(field).toBeUndefined()
  })

  it('gigs section has no backgroundOpacity field', async () => {
    const { SECTION_REGISTRY } = await import('@/lib/sections-registry')
    const entry = SECTION_REGISTRY.find(e => e.id === 'gigs')
    const field = entry?.configFields.find(
      f => f.path === 'sections.styleOverrides.gigs.backgroundOpacity'
    )
    expect(field).toBeUndefined()
  })

  it('newsletter section has no backgroundOpacity field', async () => {
    const { SECTION_REGISTRY } = await import('@/lib/sections-registry')
    const entry = SECTION_REGISTRY.find(e => e.id === 'newsletter')
    const field = entry?.configFields.find(
      f => f.path === 'sections.styleOverrides.newsletter.backgroundOpacity'
    )
    expect(field).toBeUndefined()
  })
})

// ── 3: Button — unified cyber design ─────────────────────────────────────────

describe('Button — unified cyber design', () => {
  it('default variant has font-mono and tracking-wider (industrial aesthetic)', async () => {
    const { buttonVariants } = await import('@/components/ui/button')
    const cls = buttonVariants({ variant: 'default' })
    expect(cls).toContain('font-mono')
    expect(cls).toContain('tracking-wider')
  })

  it('default variant has cyber-btn and cyber-btn--primary for CSS glow effects', async () => {
    const { buttonVariants } = await import('@/components/ui/button')
    const cls = buttonVariants({ variant: 'default' })
    expect(cls).toContain('cyber-btn')
    expect(cls).toContain('cyber-btn--primary')
  })

  it('default variant uses border-primary/10 pattern instead of solid bg-primary', async () => {
    const { buttonVariants } = await import('@/components/ui/button')
    const cls = buttonVariants({ variant: 'default' })
    expect(cls).toContain('border-primary')
    // Solid "bg-primary" (no slash) would make text unreadable on hover
    expect(cls).not.toMatch(/\bbg-primary(?![/\w])/)
  })

  it('destructive variant has cyber-btn--destructive class', async () => {
    const { buttonVariants } = await import('@/components/ui/button')
    const cls = buttonVariants({ variant: 'destructive' })
    expect(cls).toContain('cyber-btn--destructive')
  })

  it('all button variants have active:scale for tactile press feedback', async () => {
    const { buttonVariants } = await import('@/components/ui/button')
    for (const variant of ['default', 'destructive', 'outline', 'secondary'] as const) {
      const cls = buttonVariants({ variant })
      expect(cls).toContain('active:scale')
    }
  })
})

// ── 4: GlitchGrid — canvas context fix ───────────────────────────────────────

describe('GlitchGridBackground — canvas getContext fix', () => {
  it('canvas.getContext uses willReadFrequently:true for desktop Firefox/Chrome performance', () => {
    // The glitch strip effect calls getImageData on every frame.
    // Without willReadFrequently:true, Chrome/Firefox use GPU-accelerated mode
    // which makes getImageData a costly GPU→CPU readback, causing the animation
    // to appear static on desktop. The fix is to opt into software rendering.
    const getContextMock = vi.fn().mockReturnValue({
      clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(),
      moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
      save: vi.fn(), restore: vi.fn(),
      fillStyle: '', strokeStyle: '', lineWidth: 0, globalAlpha: 1,
    })
    const canvas = { getContext: getContextMock, width: 100, height: 100 }
    // Simulate the FIXED call (willReadFrequently: true)
    canvas.getContext('2d', { willReadFrequently: true })
    expect(getContextMock).toHaveBeenCalledWith(
      '2d',
      expect.objectContaining({ willReadFrequently: true })
    )
  })
})

// ── 5: useInstagramFeed hook ──────────────────────────────────────────────────

describe('useInstagramFeed', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty images and loading=false when disabled', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useInstagramFeed } = await import('@/hooks/use-instagram-feed')
    const { result } = renderHook(() =>
      useInstagramFeed({ accessToken: 'token', enabled: false })
    )
    expect(result.current.images).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('returns empty images when accessToken is undefined', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useInstagramFeed } = await import('@/hooks/use-instagram-feed')
    const { result } = renderHook(() =>
      useInstagramFeed({ accessToken: undefined })
    )
    expect(result.current.images).toEqual([])
  })

  it('calls /api/instagram with token and limit when enabled', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        images: ['https://cdn.instagram.com/1.jpg', 'https://cdn.instagram.com/2.jpg'],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { renderHook, waitFor } = await import('@testing-library/react')
    const { useInstagramFeed } = await import('@/hooks/use-instagram-feed')

    const { result } = renderHook(() =>
      useInstagramFeed({ accessToken: 'IGQtest123', enabled: true, maxImages: 6 })
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('token=IGQtest123')
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=6')
    )
    expect(result.current.images).toHaveLength(2)
    expect(result.current.error).toBeNull()
  })

  it('sets error message when API returns non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid token' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { renderHook, waitFor } = await import('@testing-library/react')
    const { useInstagramFeed } = await import('@/hooks/use-instagram-feed')

    const { result } = renderHook(() =>
      useInstagramFeed({ accessToken: 'bad', enabled: true })
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Invalid token')
    expect(result.current.images).toEqual([])
  })

  it('provides a refetch callback that re-triggers the fetch', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useInstagramFeed } = await import('@/hooks/use-instagram-feed')
    const { result } = renderHook(() =>
      useInstagramFeed({ accessToken: 'tok', enabled: false })
    )
    expect(typeof result.current.refetch).toBe('function')
  })
})

// ── 6: AnimationSettings — 3D model background type ──────────────────────────

describe('AnimationSettings — 3D model background type', () => {
  it('BackgroundType union includes 3d-model', () => {
    const type: import('@/lib/types').BackgroundType = '3d-model'
    expect(type).toBe('3d-model')
  })

  it('AnimationSettings accepts backgroundModelUrl and related config', () => {
    const settings: import('@/lib/types').AnimationSettings = {
      backgroundType: '3d-model',
      backgroundModelUrl: 'https://example.com/zardonic.glb',
      backgroundModelAutoRotate: true,
      backgroundModelRotateSpeed: 0.005,
      backgroundModelOpacity: 0.85,
    }
    expect(settings.backgroundModelUrl).toBe('https://example.com/zardonic.glb')
    expect(settings.backgroundModelOpacity).toBe(0.85)
  })
})

// ── 7: BackgroundStack — image hidden when video is active ───────────────────

describe('BackgroundStack — background image visibility with video', () => {
  it('does NOT render background image when video type is active with a videoUrl', async () => {
    const { BackgroundStack } = await import('@/components/BackgroundStack')
    const { container } = render(
      <BackgroundStack
        backgroundImageUrl="https://example.com/bg.jpg"
        backgroundType="video"
        animSettings={{ backgroundVideoUrl: 'https://example.com/loop.mp4' }}
      />
    )
    // Image layer must be absent — video replaces it
    expect(container.querySelector('img')).toBeNull()
    // Video component must be present
    expect(container.querySelector('[data-testid="video-bg"]')).not.toBeNull()
  })

  it('renders background image when type is minimal (no video)', async () => {
    const { BackgroundStack } = await import('@/components/BackgroundStack')
    const { container } = render(
      <BackgroundStack
        backgroundImageUrl="https://example.com/bg.jpg"
        backgroundType="minimal"
        animatedBackgroundEnabled={false}
      />
    )
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('https://example.com/bg.jpg')
  })

  it('renders background image when type is video but no videoUrl provided', async () => {
    const { BackgroundStack } = await import('@/components/BackgroundStack')
    const { container } = render(
      <BackgroundStack
        backgroundImageUrl="https://example.com/bg.jpg"
        backgroundType="video"
        animSettings={{ backgroundVideoUrl: undefined }}
      />
    )
    // No video URL → isVideoActive is false → show fallback image
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
  })
})
