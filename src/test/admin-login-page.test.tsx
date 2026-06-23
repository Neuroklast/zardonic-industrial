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

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('renders a native form that POSTs to the canonical server submit handler', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('redirect=/admin/releases'))
    const { container } = render(<LoginForm />)

    const form = container.querySelector('form') as HTMLFormElement
    expect(form).toBeTruthy()
    expect(form.getAttribute('method')).toBe('POST')
    expect(form.getAttribute('action')).toBe('/admin/login/submit')

    // hidden redirectTo is forwarded
    const hidden = container.querySelector('input[name="redirectTo"]') as HTMLInputElement | null
    expect(hidden?.value).toBe('/admin/releases')
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
