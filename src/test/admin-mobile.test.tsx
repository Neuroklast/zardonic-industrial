/**
 * Tests for mobile-first optimizations:
 *   - AdminNav touch targets (≥ 44px via py-3 / min-h-[44px])
 *   - Responsive dashboard grid (grid-cols-1 xs:grid-cols-2)
 *   - Table overflow-x-auto wrappers
 *   - Login inputs text-base (iOS zoom prevention)
 *   - Tailwind xs breakpoint in config
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Module mocks (hoisted so all imported modules see them) ─────────────────

const { mockPathname } = vi.hoisted(() => ({
  mockPathname: vi.fn(() => '/admin'),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string
    children: React.ReactNode
    className?: string
    onClick?: () => void
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/supabaseServer', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabaseClient', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
    },
  }),
}))

vi.mock('@/app/admin/_actions/gigs', () => ({ deleteGig: vi.fn() }))
vi.mock('@/app/admin/_actions/soundpacks', () => ({ deleteSoundpack: vi.fn() }))
vi.mock('@/app/admin/_actions/merchandise', () => ({ deleteMerchandise: vi.fn() }))
vi.mock('@/app/admin/_actions/musicHighlights', () => ({ deleteMusicHighlight: vi.fn() }))
vi.mock('@/app/admin/_actions/social', () => ({ deleteSocialLink: vi.fn() }))
vi.mock('@/app/admin/_actions/partners', () => ({ deletePartner: vi.fn() }))
vi.mock('@/app/admin/(protected)/releases/DeleteReleaseButton', () => ({
  DeleteReleaseButton: () => <button>Delete</button>,
}))

// ─── Imports (after mocks so they pick up the mocked modules) ────────────────

import { AdminNav } from '@/app/admin/_components/AdminNav'
import AdminDashboard from '@/app/admin/(protected)/page'
import ReleasesPage from '@/app/admin/(protected)/releases/page'
import GigsPage from '@/app/admin/(protected)/gigs/page'
import SoundpacksPage from '@/app/admin/(protected)/soundpacks/page'
import MerchandisePage from '@/app/admin/(protected)/merchandise/page'
import AdminLoginPage from '@/app/admin/login/page'
import { createClient } from '@/lib/supabaseServer'

// ─── AdminNav — touch targets ─────────────────────────────────────────────────

describe('AdminNav — touch targets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname.mockReturnValue('/admin')
  })

  it('renders nav links with py-3 class for adequate touch target height', () => {
    render(<AdminNav />)
    const navLinks = screen.getAllByRole('link')
    const dashboardLink = navLinks.find((l) => l.textContent?.includes('Dashboard'))
    expect(dashboardLink).toBeTruthy()
    expect(dashboardLink?.className).toContain('py-3')
  })

  it('hamburger button has min-h-[44px] and min-w-[44px] for touch accessibility', () => {
    render(<AdminNav />)
    const hamburger = screen.getByRole('button', { name: /open menu/i })
    expect(hamburger.className).toContain('min-h-[44px]')
    expect(hamburger.className).toContain('min-w-[44px]')
  })
})

// ─── AdminDashboard — responsive grid ────────────────────────────────────────

describe('AdminDashboard — responsive grid', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ count: 0 }),
      }),
    } as Awaited<ReturnType<typeof createClient>>)
  })

  it('count section grid uses grid-cols-1 for small screens', async () => {
    const result = await AdminDashboard()
    const { container } = render(result as React.ReactElement)
    const grids = container.querySelectorAll('[class*="grid-cols-1"]')
    expect(grids.length).toBeGreaterThan(0)
  })

  it('count section grid has xs:grid-cols-2 breakpoint', async () => {
    const result = await AdminDashboard()
    const { container } = render(result as React.ReactElement)
    const grids = container.querySelectorAll('[class*="xs:grid-cols-2"]')
    expect(grids.length).toBeGreaterThan(0)
  })
})

// ─── Admin table pages — overflow-x-auto wrapper ─────────────────────────────

function mockSupabaseWithRows(rows: unknown[]) {
  vi.mocked(createClient).mockResolvedValue({
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: rows }),
      }),
    }),
  } as Awaited<ReturnType<typeof createClient>>)
}

describe('Admin table pages — overflow-x-auto wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ReleasesPage wraps table in overflow-x-auto', async () => {
    mockSupabaseWithRows([{ id: '1', title: 'Test', type: 'album', release_date: '2024-01-01' }])
    const result = await ReleasesPage()
    const { container } = render(result as React.ReactElement)
    const wrapper = container.querySelector('.overflow-x-auto')
    expect(wrapper).toBeTruthy()
    expect(wrapper?.querySelector('table')).toBeTruthy()
  })

  it('GigsPage wraps table in overflow-x-auto', async () => {
    mockSupabaseWithRows([
      { id: '1', title: 'Test Gig', city: 'Berlin', event_date: '2024-06-01T20:00:00Z' },
    ])
    const result = await GigsPage()
    const { container } = render(result as React.ReactElement)
    const wrapper = container.querySelector('.overflow-x-auto')
    expect(wrapper).toBeTruthy()
    expect(wrapper?.querySelector('table')).toBeTruthy()
  })

  it('SoundpacksPage wraps table in overflow-x-auto', async () => {
    mockSupabaseWithRows([{ id: '1', title: 'Pack', display_order: 1 }])
    const result = await SoundpacksPage()
    const { container } = render(result as React.ReactElement)
    const wrapper = container.querySelector('.overflow-x-auto')
    expect(wrapper).toBeTruthy()
    expect(wrapper?.querySelector('table')).toBeTruthy()
  })

  it('MerchandisePage wraps table in overflow-x-auto', async () => {
    mockSupabaseWithRows([{ id: '1', title: 'T-Shirt', display_order: 1 }])
    const result = await MerchandisePage()
    const { container } = render(result as React.ReactElement)
    const wrapper = container.querySelector('.overflow-x-auto')
    expect(wrapper).toBeTruthy()
    expect(wrapper?.querySelector('table')).toBeTruthy()
  })
})

// ─── AdminLoginPage — iOS zoom prevention ────────────────────────────────────

describe('AdminLoginPage — input font size', () => {
  it('email input has text-base class to prevent iOS auto-zoom on focus', () => {
    const { container } = render(<AdminLoginPage />)
    const emailInput = container.querySelector('input[type="email"]')
    expect(emailInput?.className).toContain('text-base')
  })

  it('password input has text-base class to prevent iOS auto-zoom on focus', () => {
    const { container } = render(<AdminLoginPage />)
    const passwordInput = container.querySelector('input[type="password"]')
    expect(passwordInput?.className).toContain('text-base')
  })
})

// ─── Tailwind xs breakpoint ───────────────────────────────────────────────────

describe('tailwind.config.js — xs breakpoint', () => {
  it('defines xs: 480px in the extend.screens section', async () => {
    const config = await import('../../tailwind.config.js')
    const theme = config.default?.theme ?? config.default
    const screens = theme?.extend?.screens ?? theme?.screens ?? {}
    expect(screens).toHaveProperty('xs', '480px')
  })
})
