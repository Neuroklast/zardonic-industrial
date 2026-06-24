import { describe, expect, it } from 'vitest'
import { getPaginationRange, paginateItems } from '@/lib/browse-pagination'

describe('browse pagination', () => {
  it('paginates items and clamps page numbers', () => {
    const items = Array.from({ length: 25 }, (_, index) => index)
    const pageOne = paginateItems(items, 1, 12)
    const pageThree = paginateItems(items, 99, 12)

    expect(pageOne.items).toHaveLength(12)
    expect(pageOne.totalPages).toBe(3)
    expect(pageOne.currentPage).toBe(1)
    expect(pageThree.currentPage).toBe(3)
    expect(pageThree.items).toHaveLength(1)
  })

  it('builds compact pagination ranges with ellipsis', () => {
    expect(getPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(getPaginationRange(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10])
  })
})