/**
 * Activation key validation for deployments.
 * Each deployment must supply a VITE_ACTIVATION_KEY environment variable.
 * On app startup, the key is validated against the central API.
 * The result is cached in sessionStorage for the duration of the browser session.
 */
import { isPrimaryInstance } from '@/lib/primary-check'

export type LicenseTier = 'free' | 'premium' | 'agency'

export interface ActivationResult {
  valid: boolean
  tier?: LicenseTier
  features?: string[]
  assignedThemes?: string[]
  error?: string
}

const SESSION_KEY = 'zi-activation-result'

const ACTIVATION_API_URL =
  (import.meta.env.VITE_ACTIVATION_API_URL as string | undefined) ||
  '/api/validate-key'

function getCachedResult(): ActivationResult | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ActivationResult
  } catch {
    return null
  }
}

function setCachedResult(result: ActivationResult): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result))
  } catch {
    // sessionStorage may be unavailable; ignore.
  }
}

export async function validateActivationKey(): Promise<ActivationResult> {
  if (isPrimaryInstance()) {
    return { valid: true, tier: 'agency', features: [] }
  }

  const cached = getCachedResult()
  if (cached !== null) return cached

  const key = import.meta.env.VITE_ACTIVATION_KEY as string | undefined

  if (!key || key.trim() === '') {
    const result: ActivationResult = { valid: false, error: 'No activation key configured' }
    setCachedResult(result)
    return result
  }

  try {
    const response = await fetch(ACTIVATION_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key.trim() }),
    })

    if (!response.ok) {
      return { valid: false, error: 'Validation service unavailable' }
    }

    const data = await response.json() as ActivationResult
    setCachedResult(data)
    return data
  } catch {
    return { valid: false, error: 'Validation service unavailable' }
  }
}

export function clearActivationCache(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}
