import type { ReactElement } from 'react'
import { describe, expect, it, beforeEach, vi } from 'vitest'

const { mockCreateActionClient, mockRedirect } = vi.hoisted(() => ({
  mockCreateActionClient: vi.fn(),
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

vi.mock('@/lib/supabaseServer', () => ({
  createActionClient: mockCreateActionClient,
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

vi.mock('@/app/admin/_components/AdminNav', () => ({
  AdminNav: () => null,
}))

vi.mock('@/app/admin/_components/AdminHelpPalette', () => ({
  AdminHelpPalette: () => null,
}))

import ProtectedAdminLayout from '@/app/admin/(protected)/layout'

describe('ProtectedAdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without redirect when middleware-authenticated user exists', async () => {
    const mockFrom = vi.fn()
    mockCreateActionClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-user' } },
        }),
      },
      from: mockFrom,
    })

    const result = await ProtectedAdminLayout({
      children: <div>secure content</div>,
    })

    expect(result).toBeTruthy()
    expect((result as ReactElement).props.children).toBeTruthy()
    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('redirects to login when fallback user lookup fails', async () => {
    mockCreateActionClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
      from: vi.fn(),
    })

    await expect(
      ProtectedAdminLayout({
        children: <div>secure content</div>,
      }),
    ).rejects.toThrow('NEXT_REDIRECT:/admin/login')
    expect(mockRedirect).toHaveBeenCalledWith('/admin/login')
  })

  it('redirects with config error when supabase client creation fails', async () => {
    mockCreateActionClient.mockRejectedValue(new Error('missing env'))

    await expect(
      ProtectedAdminLayout({
        children: <div>secure content</div>,
      }),
    ).rejects.toThrow('NEXT_REDIRECT:/admin/login?error=config')
    expect(mockRedirect).toHaveBeenCalledWith('/admin/login?error=config')
  })
})
