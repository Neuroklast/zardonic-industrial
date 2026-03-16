import { useState, useEffect, startTransition } from 'react'
import { isPrimaryInstance } from '@/lib/primary-check'

type ActivationStatus = 'loading' | 'valid' | 'invalid' | 'bypassed'

const ACTIVATION_KEY = import.meta.env.VITE_ACTIVATION_KEY as string | undefined
const IS_PRIMARY = isPrimaryInstance()
const VALIDATE_URL =
  (import.meta.env.VITE_ACTIVATION_API_URL as string | undefined) ||
  '/api/validate-key'
const CACHE_KEY = 'activation_status_cache'
const CACHE_TTL_MS = 1000 * 60 * 60 * 24

export const LOCAL_ACTIVATION_KEY = 'zi-local-activation-key'

interface CacheEntry {
  valid: boolean
  timestamp: number
}

function getCachedStatus(): boolean | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return entry.valid
  } catch {
    return null
  }
}

function setCachedStatus(valid: boolean) {
  try {
    const entry: CacheEntry = { valid, timestamp: Date.now() }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // sessionStorage not available
  }
}

export function getLocalActivationKey(): string | null {
  try {
    return localStorage.getItem(LOCAL_ACTIVATION_KEY) || null
  } catch {
    return null
  }
}

export function saveLocalActivationKey(key: string): void {
  try {
    localStorage.setItem(LOCAL_ACTIVATION_KEY, key)
  } catch {
    // ignore
  }
}

export function clearLocalActivationKey(): void {
  try {
    localStorage.removeItem(LOCAL_ACTIVATION_KEY)
  } catch {
    // ignore
  }
}

function processUrlHashKey(): void {
  try {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    const match = hash.match(/[#&]?activate=([^&]+)/)
    if (!match?.[1]) return

    const urlKey = decodeURIComponent(match[1]).trim()
    if (!urlKey) return

    saveLocalActivationKey(urlKey)
    const withoutActivate = hash.replace(/[#&]?activate=[^&]+/, '').replace(/^#$/, '')
    const newUrl = withoutActivate ? `#${withoutActivate.replace(/^#/, '')}` : window.location.pathname
    window.history.replaceState(null, '', newUrl)
  } catch {
    // URL manipulation not available
  }
}

export function useActivationKey() {
  const [status, setStatus] = useState<ActivationStatus>(() => IS_PRIMARY ? 'bypassed' : 'loading')

  useEffect(() => {
    if (IS_PRIMARY) return

    processUrlHashKey()

    const key = ACTIVATION_KEY?.trim() || getLocalActivationKey()?.trim() || ''

    if (!key) {
      startTransition(() => setStatus('invalid'))
      return
    }

    const cached = getCachedStatus()
    if (cached !== null) {
      startTransition(() => setStatus(cached ? 'valid' : 'invalid'))
      return
    }

    let cancelled = false
    const validate = async () => {
      try {
        const res = await fetch(VALIDATE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
          signal: AbortSignal.timeout(8000),
        })
        if (cancelled) return
        const data = await res.json()
        const valid = Boolean(data?.valid)
        setCachedStatus(valid)
        setStatus(valid ? 'valid' : 'invalid')
      } catch {
        if (cancelled) return
        setStatus('invalid')
      }
    }

    validate()
    return () => { cancelled = true }
  }, [])

  return {
    status,
    isValid: status === 'valid' || status === 'bypassed',
    isLoading: status === 'loading',
  }
}
