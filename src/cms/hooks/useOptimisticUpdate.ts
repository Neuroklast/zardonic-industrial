/**
 * useOptimisticUpdate — optimistic UI helper for CMS mutations.
 * Immediately applies a change to local state while the API call is in flight,
 * then rolls back on failure.
 */

import { useState, useCallback } from 'react'

export function useOptimisticUpdate<T>(initialItems: T[]) {
  const [items, setItems] = useState<T[]>(initialItems)

  const applyOptimistic = useCallback(
    async (
      optimisticFn: (current: T[]) => T[],
      commitFn: () => Promise<void>,
      rollbackFn?: (current: T[]) => T[],
    ) => {
      const previous = items
      setItems(optimisticFn(previous))
      try {
        await commitFn()
      } catch {
        setItems(rollbackFn ? rollbackFn(previous) : previous)
      }
    },
    [items],
  )

  return { items, setItems, applyOptimistic }
}
