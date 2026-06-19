import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSearchParams, mockRouterPush, mockRouterRefresh, mockSignInWithPassword } = vi.hoisted(() => ({
  mockSearchParams: vi.fn(),
  mockRouterPush: vi.fn(),
  mockRouterRefresh: vi.fn(),
  mockSignInWithPassword: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams(),
  useRouter: () => ({
    push: mockRouterPush,
    refresh: mockRouterRefresh,
  }),
}))

vi.mock('@/lib/supabaseClient', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}))

import LoginForm from '@/app/admin/login/_components/LoginForm'

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.mockReturnValue(new URLSearchParams())
    mockSignInWithPassword.mockResolvedValue({ error: null })
  })

  it('renders email and password fields with a sign-in button', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('handles client-side sign-in and redirect', async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('redirect=/admin/releases'))
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    expect(mockRouterPush).toHaveBeenCalledWith('/admin/releases')
    expect(mockRouterRefresh).toHaveBeenCalled()
  })

  it('displays auth error message on failed sign-in', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid credentials' } })
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('shows the forbidden error message when error=forbidden is in the URL', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('error=forbidden'))
    render(<LoginForm />)
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })

  it('shows the config error message when error=config is in the URL', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('error=config'))
    render(<LoginForm />)
    expect(screen.getByText(/supabase is not configured/i)).toBeInTheDocument()
  })

  it('shows the msg param as auth error text', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('msg=Invalid+login+credentials'))
    render(<LoginForm />)
    expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
  })

  it('does not show msg when error=forbidden is set', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('error=forbidden&msg=Invalid+login+credentials'))
    render(<LoginForm />)
    expect(screen.queryByText('Invalid login credentials')).not.toBeInTheDocument()
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })
})
