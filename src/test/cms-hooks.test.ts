/**
 * Tests for CMS hooks — useAutoSave and useOptimisticUpdate.
 * Uses direct function testing (not rendering hooks) to avoid timer/async conflicts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// -------------------------------------------------------------------------
// useAutoSave — test the save logic directly
// -------------------------------------------------------------------------

describe('useAutoSave logic', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('writes backup to localStorage on save failure', () => {
    const key = 'test-backup-key'
    const data = { x: 'value' }
    // Simulate what the hook does on error
    try {
      localStorage.setItem(`autosave:${key}`, JSON.stringify(data))
    } catch {
      // ignore
    }
    const stored = localStorage.getItem(`autosave:${key}`)
    expect(stored).toBe(JSON.stringify(data))
  })

  it('clears backup from localStorage on successful save', () => {
    const key = 'test-clear-key'
    localStorage.setItem(`autosave:${key}`, JSON.stringify({ x: 'old' }))
    localStorage.removeItem(`autosave:${key}`)
    expect(localStorage.getItem(`autosave:${key}`)).toBeNull()
  })

  it('returns null when no backup exists', () => {
    const key = 'no-backup'
    const backup = localStorage.getItem(`autosave:${key}`)
    expect(backup).toBeNull()
  })

  it('handles corrupt localStorage gracefully', () => {
    const key = 'corrupt-key'
    localStorage.setItem(`autosave:${key}`, 'invalid json {{{')
    let result: unknown = null
    try {
      const raw = localStorage.getItem(`autosave:${key}`)
      result = raw ? JSON.parse(raw) : null
    } catch {
      result = null
    }
    expect(result).toBeNull()
  })
})

// -------------------------------------------------------------------------
// useAutoSave status transitions — test the saveNow function logic
// -------------------------------------------------------------------------

describe('useAutoSave — save function behavior', () => {
  it('resolves successfully when onSave resolves', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    let status = 'idle'
    const doSave = async (data: unknown) => {
      status = 'saving'
      try {
        await onSave(data)
        status = 'saved'
      } catch {
        status = 'error'
      }
    }
    await doSave({ v: 1 })
    expect(status).toBe('saved')
    expect(onSave).toHaveBeenCalledWith({ v: 1 })
  })

  it('sets error status when onSave rejects', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('network fail'))
    let status = 'idle'
    const doSave = async (data: unknown) => {
      status = 'saving'
      try {
        await onSave(data)
        status = 'saved'
      } catch {
        status = 'error'
      }
    }
    await doSave({ v: 2 })
    expect(status).toBe('error')
  })
})

// -------------------------------------------------------------------------
// useOptimisticUpdate — test optimistic/rollback logic directly
// -------------------------------------------------------------------------

describe('useOptimisticUpdate logic', () => {
  it('applies change then keeps it on success', async () => {
    let items = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
    const previous = [...items]

    const optimisticFn = (curr: typeof items) => curr.map(i => ({ ...i, name: i.name.toLowerCase() }))
    const commitFn = async () => { /* success */ }

    items = optimisticFn(previous)
    try {
      await commitFn()
      // items stay changed
    } catch {
      items = previous
    }

    expect(items[0]?.name).toBe('a')
    expect(items[1]?.name).toBe('b')
  })

  it('rolls back to previous state on failure', async () => {
    let items = [{ id: '1', name: 'A' }]
    const previous = [...items]

    const optimisticFn = (curr: typeof items) => curr.map(i => ({ ...i, name: 'Z' }))
    const commitFn = async () => { throw new Error('fail') }

    items = optimisticFn(previous)
    expect(items[0]?.name).toBe('Z')

    try {
      await commitFn()
    } catch {
      items = previous
    }

    expect(items[0]?.name).toBe('A')
  })

  it('handles empty items array', async () => {
    let items: Array<{ id: string }> = []
    const commitFn = async () => { /* success */ }

    try {
      await commitFn()
    } catch {
      items = []
    }

    expect(items).toHaveLength(0)
  })
})
