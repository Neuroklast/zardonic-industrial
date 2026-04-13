/**
 * Tests for Phase 3 additions:
 *   - useUndoRedo hook
 *   - State components: LoadingState, ErrorState, EmptyState
 *   - useAdminKeyboardShortcuts hook
 *   - SectionEditorFactory enhancements (expand/collapse all, group summary)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useUndoRedo } from '@/cms/hooks/useUndoRedo'
import { useAdminKeyboardShortcuts } from '@/cms/hooks/useAdminKeyboardShortcuts'
import { LoadingState, ErrorState, EmptyState } from '@/cms/components/states'
import { SectionEditorFactory } from '@/cms/components/SectionEditorFactory'
import type { AdminSectionSchema } from '@/lib/admin-section-schema'

// ─── useUndoRedo ──────────────────────────────────────────────────────────────

describe('useUndoRedo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('initializes with historySize=1 and historyIndex=1', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }))
    expect(result.current.historySize).toBe(1)
    expect(result.current.historyIndex).toBe(1)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('undo returns null when at start of history', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }))
    let undoResult: unknown
    act(() => {
      undoResult = result.current.undo()
    })
    expect(undoResult).toBeNull()
  })

  it('redo returns null when at end of history', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }))
    let redoResult: unknown
    act(() => {
      redoResult = result.current.redo()
    })
    expect(redoResult).toBeNull()
  })

  it('push (debounced) adds entry after DEBOUNCE_MS', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }))
    act(() => {
      result.current.push({ value: 'state1' })
    })
    // Before debounce fires, history is still 1
    expect(result.current.historySize).toBe(1)

    // Advance timers to trigger debounce
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(result.current.historySize).toBe(2)
    expect(result.current.canUndo).toBe(true)
  })

  it('undo returns previous state after push', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }))
    act(() => {
      result.current.push({ value: 'state1' })
      vi.advanceTimersByTime(600)
    })
    let undoResult: unknown
    act(() => {
      undoResult = result.current.undo()
    })
    expect(undoResult).toEqual({ value: 'initial' })
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)
  })

  it('redo moves forward again after undo', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }))
    act(() => {
      result.current.push({ value: 'state1' })
      vi.advanceTimersByTime(600)
    })
    act(() => {
      result.current.undo()
    })
    let redoResult: unknown
    act(() => {
      redoResult = result.current.redo()
    })
    expect(redoResult).toEqual({ value: 'state1' })
    expect(result.current.canRedo).toBe(false)
  })

  it('reset clears history and sets new base state', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }))
    act(() => {
      result.current.push({ value: 'state1' })
      vi.advanceTimersByTime(600)
    })
    expect(result.current.historySize).toBe(2)
    act(() => {
      result.current.reset({ value: 'fresh' })
    })
    expect(result.current.historySize).toBe(1)
    expect(result.current.historyIndex).toBe(1)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('truncates redo branch when new state is pushed after undo', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }))
    act(() => {
      result.current.push({ value: 'state1' })
      vi.advanceTimersByTime(600)
    })
    act(() => {
      result.current.undo()
    })
    // Now push a new state — this should truncate redo
    act(() => {
      result.current.push({ value: 'state2' })
      vi.advanceTimersByTime(600)
    })
    expect(result.current.canRedo).toBe(false)
    expect(result.current.historySize).toBe(2)
  })

  it('does not add duplicate consecutive entries', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }))
    act(() => {
      result.current.push({ value: 'initial' }) // same as first entry
      vi.advanceTimersByTime(600)
    })
    expect(result.current.historySize).toBe(1)
  })

  it('exposes historyIndex and historySize correctly', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'a' }))
    act(() => {
      result.current.push({ value: 'b' })
      vi.advanceTimersByTime(600)
    })
    act(() => {
      result.current.push({ value: 'c' })
      vi.advanceTimersByTime(600)
    })
    expect(result.current.historySize).toBe(3)
    expect(result.current.historyIndex).toBe(3)
    act(() => {
      result.current.undo()
    })
    expect(result.current.historyIndex).toBe(2)
  })
})

// ─── useAdminKeyboardShortcuts ────────────────────────────────────────────────

describe('useAdminKeyboardShortcuts', () => {
  it('calls onSave when Ctrl+S is pressed', () => {
    const onSave = vi.fn()
    renderHook(() => useAdminKeyboardShortcuts({ onSave }))
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }),
      )
    })
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('calls onUndo when Ctrl+Z is pressed', () => {
    const onUndo = vi.fn()
    renderHook(() => useAdminKeyboardShortcuts({ onUndo }))
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }),
      )
    })
    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  it('calls onRedo when Ctrl+Y is pressed', () => {
    const onRedo = vi.fn()
    renderHook(() => useAdminKeyboardShortcuts({ onRedo }))
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true }),
      )
    })
    expect(onRedo).toHaveBeenCalledTimes(1)
  })

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn()
    renderHook(() => useAdminKeyboardShortcuts({ onEscape }))
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
    })
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('does not call handlers when enabled=false', () => {
    const onSave = vi.fn()
    renderHook(() => useAdminKeyboardShortcuts({ onSave, enabled: false }))
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }),
      )
    })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('removes listeners on unmount', () => {
    const onSave = vi.fn()
    const { unmount } = renderHook(() => useAdminKeyboardShortcuts({ onSave }))
    unmount()
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }),
      )
    })
    expect(onSave).not.toHaveBeenCalled()
  })
})

// ─── LoadingState ─────────────────────────────────────────────────────────────

describe('LoadingState', () => {
  it('renders with aria-busy and role=status', () => {
    render(<LoadingState />)
    const el = screen.getByRole('status')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('aria-busy', 'true')
  })

  it('shows section label when provided', () => {
    render(<LoadingState label="Hero" />)
    expect(screen.getByText('Hero')).toBeInTheDocument()
  })

  it('shows aria-label including section name', () => {
    render(<LoadingState label="Bio" />)
    const el = screen.getByRole('status')
    expect(el).toHaveAttribute('aria-label', 'Loading Bio')
  })

  it('renders without label or icon', () => {
    const { container } = render(<LoadingState />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ─── ErrorState ──────────────────────────────────────────────────────────────

describe('ErrorState', () => {
  it('renders with role=alert', () => {
    render(<ErrorState message="Something failed" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows the error message', () => {
    render(<ErrorState message="Network timed out" />)
    expect(screen.getByText('Network timed out')).toBeInTheDocument()
  })

  it('shows Retry button when onRetry is provided', () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Oops" onRetry={onRetry} />)
    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not show Retry button when onRetry is omitted', () => {
    render(<ErrorState message="Oops" />)
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
  })

  it('shows collapsible technical detail when detail is provided', () => {
    render(<ErrorState message="Oops" detail="Error code: 500" />)
    const detailToggle = screen.getByRole('button', { name: /technical details/i })
    expect(detailToggle).toBeInTheDocument()
    fireEvent.click(detailToggle)
    expect(screen.getByText(/Error code: 500/)).toBeInTheDocument()
  })

  it('uses appropriate heading for network variant', () => {
    render(<ErrorState message="Oops" variant="network" />)
    expect(screen.getByText('Connection error')).toBeInTheDocument()
  })

  it('uses appropriate heading for auth variant', () => {
    render(<ErrorState message="Oops" variant="auth" />)
    expect(screen.getByText('Authentication required')).toBeInTheDocument()
  })
})

// ─── EmptyState ───────────────────────────────────────────────────────────────

describe('EmptyState', () => {
  it('renders with the section label', () => {
    render(<EmptyState label="Gallery" />)
    expect(screen.getByText(/Gallery is empty/)).toBeInTheDocument()
  })

  it('shows description when provided', () => {
    render(<EmptyState label="Gallery" description="A collection of images." />)
    expect(screen.getByText('A collection of images.')).toBeInTheDocument()
  })

  it('shows field count when provided', () => {
    render(<EmptyState label="Gallery" fieldCount={4} />)
    expect(screen.getByText(/4 fields available/i)).toBeInTheDocument()
  })

  it('shows Start editing button when onStartEditing is provided', () => {
    const onStartEditing = vi.fn()
    render(<EmptyState label="Gallery" onStartEditing={onStartEditing} />)
    const btn = screen.getByRole('button', { name: /start editing gallery/i })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onStartEditing).toHaveBeenCalledTimes(1)
  })

  it('does not show Start editing button when onStartEditing is omitted', () => {
    render(<EmptyState label="Gallery" />)
    expect(screen.queryByRole('button', { name: /start editing/i })).not.toBeInTheDocument()
  })
})

// ─── SectionEditorFactory enhancements ───────────────────────────────────────

describe('SectionEditorFactory — Phase 3 enhancements', () => {
  const schema: AdminSectionSchema = {
    sectionId: 'test',
    label: 'Test',
    icon: 'Star',
    description: 'A test schema.',
    supportsPreview: false,
    fields: [
      { key: 'name', type: 'text', label: 'Name', group: 'Basic' },
      { key: 'bio', type: 'textarea', label: 'Bio', group: 'Basic' },
      { key: 'url', type: 'url', label: 'Website', group: 'Links' },
    ],
    fieldGroups: [
      { id: 'Basic', label: 'Basic Info', defaultExpanded: true },
      { id: 'Links', label: 'Links', defaultExpanded: false },
    ],
    getDefaultData: () => ({ name: '', bio: '', url: '' }),
  }

  it('renders expand all / collapse all toggles when multiple groups', () => {
    render(
      <SectionEditorFactory
        schema={schema}
        data={{ name: '', bio: '', url: '' }}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /expand all/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /collapse all/i })).toBeInTheDocument()
  })

  it('shows field count in group header when expanded', () => {
    render(
      <SectionEditorFactory
        schema={schema}
        data={{ name: '', bio: '', url: '' }}
        onChange={vi.fn()}
      />,
    )
    // "Basic Info" group header should show "2 fields"
    expect(screen.getByText('2 fields')).toBeInTheDocument()
  })

  it('toggles all groups expanded when "Expand all" is clicked', () => {
    render(
      <SectionEditorFactory
        schema={schema}
        data={{ name: '', bio: '', url: '' }}
        onChange={vi.fn()}
      />,
    )
    // Initially the Links group is collapsed
    const linksGroup = screen.getByRole('button', { name: /expand links/i })
    expect(linksGroup).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getByRole('button', { name: /expand all/i }))

    // After expand all, the links group header should have aria-expanded=true
    expect(screen.getByRole('button', { name: /collapse links/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows field count summary (configured/total) when group is collapsed', () => {
    render(
      <SectionEditorFactory
        schema={schema}
        data={{ name: '', bio: '', url: '' }}
        onChange={vi.fn()}
      />,
    )
    // Links group is collapsed by default — should show 0/1 summary
    expect(screen.getByText('0/1')).toBeInTheDocument()
  })
})
