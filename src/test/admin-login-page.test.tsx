import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockPush,
  mockRefresh,
  mockSearchParams,
  mockSignInWithPassword,
  mockCreateClient,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSearchParams: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockCreateClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams(),
}))

vi.mock('@/lib/supabaseClient', () => ({
  createClient: mockCreateClient,
}))

import AdminLoginPage from '@/app/admin/login/page'

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.mockReturnValue(new URLSearchParams())
    mockCreateClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    })
  })

  it('signs in with the browser client and navigates to the redirect target', async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('redirect=%2Fadmin%2Freleases'))
    mockSignInWithPassword.mockResolvedValue({ error: null })

    render(<AdminLoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'super-secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'super-secret',
      })
    })
    expect(mockPush).toHaveBeenCalledWith('/admin/releases')
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('shows the Supabase error message and does not navigate on failed sign-in', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })

    render(<AdminLoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled()
  })
})
