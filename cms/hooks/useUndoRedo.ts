/**
 * useUndoRedo
 *
 * Maintains a history stack of data states for undo/redo support.
 *
 * Features:
 *   - Max history depth of 50 states
 *   - Debounced history push: batches rapid changes (500ms quiet period)
 *   - `undo()` and `redo()` functions
 *   - `canUndo` and `canRedo` booleans
 *   - `historyIndex` and `historySize` for UI indicator (e.g. "3/12")
 *   - `push(state)` — call this on each data change
 *   - `reset(state)` — clears history and sets the initial state
 *
 * Usage:
 * ```ts
 * const { push, undo, redo, canUndo, canRedo } = useUndoRedo(initialData)
 *
 * function handleChange(data: T) {
 *   setData(data)
 *   push(data)
 * }
 * ```
 */

import { useRef, useState, useCallback, useEffect } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_HISTORY = 50
const DEBOUNCE_MS = 500

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseUndoRedoReturn<T> {
  /** Schedules a debounced history push for the given state. */
  push: (state: T) => void
  /** Undo one step. Returns the restored state, or null if at start. */
  undo: () => T | null
  /** Redo one step. Returns the restored state, or null if at end. */
  redo: () => T | null
  /** Clears history and sets a fresh initial state. */
  reset: (state: T) => void
  /** Whether there is at least one undo step available. */
  canUndo: boolean
  /** Whether there is at least one redo step available. */
  canRedo: boolean
  /** Current position in the history stack (1-based). */
  historyIndex: number
  /** Total number of states in the history stack. */
  historySize: number
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Internal render-triggering state: pointer + history length. */
interface HistoryState {
  pointer: number
  size: number
}

/**
 * Undo/redo history stack with debounced push.
 *
 * @param initialState - The initial data state at mount time.
 */
export function useUndoRedo<T>(initialState: T): UseUndoRedoReturn<T> {
  // History stack: array of states, newest pushed to end (stored in a ref)
  const historyRef = useRef<T[]>([initialState])
  // State only used to trigger re-renders; all logic uses historyRef
  const [histState, setHistState] = useState<HistoryState>({ pointer: 0, size: 1 })
  // Debounce timer handle
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  /** Immediately push a state to the history stack (truncates redo branch). */
  const pushImmediate = useCallback((state: T) => {
    setHistState(prev => {
      const history = historyRef.current
      // Truncate any forward (redo) history
      const newHistory = history.slice(0, prev.pointer + 1)
      // Avoid duplicate consecutive entries
      const last = newHistory[newHistory.length - 1]
      if (JSON.stringify(last) === JSON.stringify(state)) return prev
      newHistory.push(state)
      // Enforce max depth
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
      }
      historyRef.current = newHistory
      return { pointer: newHistory.length - 1, size: newHistory.length }
    })
  }, [])

  /** Schedules a debounced history push. Rapid calls coalesce into one entry. */
  const push = useCallback(
    (state: T) => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current)
      }
      debounceTimer.current = setTimeout(() => {
        pushImmediate(state)
        debounceTimer.current = null
      }, DEBOUNCE_MS)
    },
    [pushImmediate],
  )

  /** Move pointer back one step and return the previous state. */
  const undo = useCallback((): T | null => {
    // Flush any pending debounced push first
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
    const { pointer } = histState
    if (pointer <= 0) return null
    const newPointer = pointer - 1
    const restoredState = historyRef.current[newPointer]
    setHistState(prev => ({ ...prev, pointer: newPointer }))
    return restoredState
  }, [histState])

  /** Move pointer forward one step and return the next state. */
  const redo = useCallback((): T | null => {
    const { pointer, size } = histState
    if (pointer >= size - 1) return null
    const newPointer = pointer + 1
    const restoredState = historyRef.current[newPointer]
    setHistState(prev => ({ ...prev, pointer: newPointer }))
    return restoredState
  }, [histState])

  /** Clear history and set a new initial state. */
  const reset = useCallback((state: T) => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
    historyRef.current = [state]
    setHistState({ pointer: 0, size: 1 })
  }, [])

  const { pointer, size } = histState

  return {
    push,
    undo,
    redo,
    reset,
    canUndo: pointer > 0,
    canRedo: pointer < size - 1,
    historyIndex: pointer + 1,
    historySize: size,
  }
}
