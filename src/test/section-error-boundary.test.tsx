import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'

function renderWithLocale(ui: ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>)
}

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('simulated bio crash')
  return <p>bio ok</p>
}

describe('SectionErrorBoundary', () => {
  it('shows localized fallback when a section child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWithLocale(
      <SectionErrorBoundary sectionName="Bio">
        <ThrowingChild shouldThrow />
      </SectionErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/Bio/)
    expect(screen.getByRole('alert')).toHaveTextContent(/Failed to render/i)
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()

    spy.mockRestore()
  })

  it('retry remounts children after a crash', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true

    function Flaky() {
      if (shouldThrow) throw new Error('once')
      return <p>recovered</p>
    }

    renderWithLocale(
      <SectionErrorBoundary sectionName="Bio">
        <Flaky />
      </SectionErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(screen.getByText('recovered')).toBeInTheDocument()

    spy.mockRestore()
  })

  it('resets when resetKey changes after an error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true

    function Flaky() {
      if (shouldThrow) throw new Error('once')
      return <p>reset via key</p>
    }

    const { rerender } = renderWithLocale(
      <SectionErrorBoundary sectionName="Bio" resetKey="en">
        <Flaky />
      </SectionErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    shouldThrow = false
    rerender(
      <LocaleProvider>
        <SectionErrorBoundary sectionName="Bio" resetKey="es">
          <Flaky />
        </SectionErrorBoundary>
      </LocaleProvider>,
    )
    expect(screen.getByText('reset via key')).toBeInTheDocument()

    spy.mockRestore()
  })
})
