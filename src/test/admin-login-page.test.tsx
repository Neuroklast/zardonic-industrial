import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSearchParams } = vi.hoisted(() => ({
  mockSearchParams: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams(),
}))

import LoginForm from '@/app/admin/login/_components/LoginForm'

describe('LoginForm (canonical native POST)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.mockReturnValue(new URLSearchParams())
  })

  it('renders email and password fields with a sign-in button', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('renders a native form that POSTs to the canonical server submit handler', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('redirect=/admin/releases'))
    render(<LoginForm />)

    const form = screen.getByRole('form') // the only form
    expect(form).toHaveAttribute('method', 'POST')
    expect(form).toHaveAttribute('action', '/admin/login/submit')

    // hidden redirectTo is forwarded
    const hidden = screen.getByDisplayValue('/admin/releases') as HTMLInputElement | null
    // The hidden input exists (value matches)
    expect(hidden || screen.getByDisplayValue('/admin/releases')).toBeTruthy()
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
