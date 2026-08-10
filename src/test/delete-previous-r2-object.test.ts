import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shouldDeletePreviousR2Object } from '@/app/admin/_lib/deletePreviousR2Object'

describe('shouldDeletePreviousR2Object', () => {
  it('returns false when there is no previous path', () => {
    expect(shouldDeletePreviousR2Object(null, 'uploads/new-1')).toBe(false)
    expect(shouldDeletePreviousR2Object(undefined, 'uploads/new-1')).toBe(false)
    expect(shouldDeletePreviousR2Object('', 'uploads/new-1')).toBe(false)
    expect(shouldDeletePreviousR2Object('   ', 'uploads/new-1')).toBe(false)
  })

  it('returns false when paths are the same', () => {
    expect(shouldDeletePreviousR2Object('uploads/same', 'uploads/same')).toBe(false)
    expect(shouldDeletePreviousR2Object('  uploads/same  ', 'uploads/same')).toBe(false)
  })

  it('returns true when previous differs from new', () => {
    expect(shouldDeletePreviousR2Object('uploads/old-1', 'uploads/new-2')).toBe(true)
  })
})

describe('deletePreviousR2ObjectIfReplaced', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('skips delete when no previous path', async () => {
    const deleteR2MediaObject = vi.fn()
    vi.doMock('@/app/admin/_actions/r2Upload', () => ({ deleteR2MediaObject }))
    const { deletePreviousR2ObjectIfReplaced } = await import(
      '@/app/admin/_lib/deletePreviousR2Object'
    )
    const result = await deletePreviousR2ObjectIfReplaced(null, 'uploads/new-1')
    expect(result).toEqual({ deleted: false })
    expect(deleteR2MediaObject).not.toHaveBeenCalled()
  })

  it('deletes previous path after successful replace', async () => {
    const deleteR2MediaObject = vi.fn().mockResolvedValue({ ok: true })
    vi.doMock('@/app/admin/_actions/r2Upload', () => ({ deleteR2MediaObject }))
    const { deletePreviousR2ObjectIfReplaced } = await import(
      '@/app/admin/_lib/deletePreviousR2Object'
    )
    const result = await deletePreviousR2ObjectIfReplaced('uploads/old-1', 'uploads/new-2')
    expect(result).toEqual({ deleted: true })
    expect(deleteR2MediaObject).toHaveBeenCalledWith('uploads/old-1')
  })

  it('returns error when delete fails without failing the caller contract', async () => {
    const deleteR2MediaObject = vi.fn().mockResolvedValue({ ok: false, error: 'boom' })
    vi.doMock('@/app/admin/_actions/r2Upload', () => ({ deleteR2MediaObject }))
    const { deletePreviousR2ObjectIfReplaced } = await import(
      '@/app/admin/_lib/deletePreviousR2Object'
    )
    const result = await deletePreviousR2ObjectIfReplaced('uploads/old-1', 'uploads/new-2')
    expect(result).toEqual({ deleted: false, error: 'boom' })
  })
})
