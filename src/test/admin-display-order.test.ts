import { describe, expect, it } from 'vitest'
import { nextDisplayOrderFromMax, orderedIdsSchema } from '@/lib/admin-display-order'

describe('nextDisplayOrderFromMax', () => {
  it('starts at 0 when the list is empty', () => {
    expect(nextDisplayOrderFromMax(null)).toBe(0)
    expect(nextDisplayOrderFromMax(undefined)).toBe(0)
  })

  it('appends after the current max', () => {
    expect(nextDisplayOrderFromMax(0)).toBe(1)
    expect(nextDisplayOrderFromMax(7)).toBe(8)
  })
})

describe('orderedIdsSchema', () => {
  it('rejects an empty list', () => {
    expect(orderedIdsSchema.safeParse([]).success).toBe(false)
  })

  it('accepts a list of ids', () => {
    expect(orderedIdsSchema.safeParse(['a', 'b']).success).toBe(true)
  })
})
