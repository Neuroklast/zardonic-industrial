/**
 * Session Management Helper
 * Handles admin authentication.
 *
 * Supports the new cookie-based auth system (`/api/auth` with HttpOnly `zd-session`
 * cookie + optional TOTP) as primary, with backwards-compatible fallback to the
 * legacy `/api/session` token-in-header approach.
 */

/**
 * Login with password (and optional TOTP token).
 * Uses the new `/api/auth` endpoint which sets an HttpOnly `zd-session` cookie.
 * Falls back to legacy `/api/session` if auth endpoint is unavailable.
 */
export async function loginWithPassword(
  password: string,
  totpToken?: string
): Promise<{ success: boolean; requiresTotp?: boolean; error?: string }> {
  try {
    // Primary: new cookie-based auth
    const body: Record<string, string> = { password }
    if (totpToken) body.totp = totpToken

    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })

    if (response.ok) {
      const data = await response.json()
      // Store legacy token for backward compat if returned
      if (data.token) {
        localStorage.setItem('admin-token', data.token)
      }
      return { success: true }
    }

    // 403 with totp_required means step 2 needed
    if (response.status === 403) {
      const data = await response.json().catch(() => ({}))
      if (data?.error === 'totp_required') {
        return { success: false, requiresTotp: true }
      }
    }

    // Fallback: try legacy session endpoint
    const legacyResponse = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (legacyResponse.ok) {
      const result = await legacyResponse.json()
      if (result.token) {
        localStorage.setItem('admin-token', result.token)
        return { success: true }
      }
    }

    const errData = await response.json().catch(() => ({}))
    return { success: false, error: errData?.error || 'Login failed' }
  } catch (error) {
    console.error('[Session] Login error:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Validate current session (checks both cookie and legacy token).
 */
export async function validateSession(): Promise<boolean> {
  try {
    // Primary: check cookie-based session via /api/auth GET
    const cookieResponse = await fetch('/api/auth', {
      method: 'GET',
      credentials: 'same-origin',
    })
    if (cookieResponse.ok) return true

    // Fallback: legacy token-in-header validation
    const token = localStorage.getItem('admin-token')
    if (!token) return false

    const legacyResponse = await fetch('/api/session', {
      method: 'GET',
      headers: { 'x-session-token': token },
    })
    return legacyResponse.ok
  } catch (error) {
    console.error('[Session] Validation error:', error)
    return false
  }
}

/**
 * Logout (clears both cookie session and legacy token).
 */
export async function logout(): Promise<void> {
  try {
    // Primary: logout via /api/auth (clears HttpOnly cookie server-side)
    await fetch('/api/auth', {
      method: 'DELETE',
      credentials: 'same-origin',
    }).catch(() => {})

    // Also clear legacy token
    const token = localStorage.getItem('admin-token')
    if (token) {
      await fetch('/api/session', {
        method: 'DELETE',
        headers: { 'x-session-token': token },
      }).catch(() => {})
    }

    localStorage.removeItem('admin-token')
  } catch (error) {
    console.error('[Session] Logout error:', error)
  }
}

/**
 * Setup initial admin password.
 */
export async function setupPassword(password: string): Promise<boolean> {
  try {
    // Primary: use /api/auth for setup
    const response = await fetch('/api/auth', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password }),
    })

    if (response.ok) {
      // Login immediately after setup
      const loginResult = await loginWithPassword(password)
      return loginResult.success
    }

    // Fallback: legacy session endpoint
    const legacyResponse = await fetch('/api/session', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (!legacyResponse.ok) return false

    const result = await loginWithPassword(password)
    return result.success
  } catch (error) {
    console.error('[Session] Setup error:', error)
    return false
  }
}

/**
 * Check if user has a valid session token in localStorage (legacy check).
 */
export function hasSessionToken(): boolean {
  return !!localStorage.getItem('admin-token')
}

/**
 * @deprecated Use loginWithPassword() which handles both auth systems.
 * Hash password using Web Crypto API (client-side SHA-256).
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
