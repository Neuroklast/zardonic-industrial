/**
 * useAutoSave — debounced auto-save with LocalStorage fallback.
 * Saves draft data 3 seconds after the last change.
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveOptions<T> {
  key: string // LocalStorage key for backup
  data: T
  onSave: (data: T) => Promise<void>
  debounceMs?: number
  enabled?: boolean
}

export function useAutoSave<T>({
  key,
  data,
  onSave,
  debounceMs = 3000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestDataRef = useRef(data)

  // Keep latest data ref updated
  useEffect(() => { latestDataRef.current = data }, [data])

  const saveNow = useCallback(async () => {
    setStatus('saving')
    try {
      await onSave(latestDataRef.current)
      setStatus('saved')
      // Remove backup on successful save
      try { localStorage.removeItem(`autosave:${key}`) } catch { /* ignore */ }
    } catch {
      setStatus('error')
      // GDPR: LocalStorage backup contains no PII beyond what the admin entered
      try { localStorage.setItem(`autosave:${key}`, JSON.stringify(latestDataRef.current)) } catch { /* ignore */ }
    }
  }, [key, onSave])

  useEffect(() => {
    if (!enabled) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus('idle')
    timerRef.current = setTimeout(() => { void saveNow() }, debounceMs)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [data, debounceMs, enabled, saveNow])

  /** Returns any locally-backed-up data for recovery */
  function getLocalBackup(): T | null {
    try {
      const raw = localStorage.getItem(`autosave:${key}`)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  return { status, saveNow, getLocalBackup }
}
