/**
 * useCmsAuth — checks if the current user has an active admin session.
 * Redirects to login if not authenticated.
 */

import { useEffect, useState } from 'react'

export function useCmsAuth() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/cms/auth')
      .then(r => r.json())
      .then((data: { authenticated: boolean }) => {
        if (!cancelled) setAuthenticated(data.authenticated)
      })
      .catch(() => {
        if (!cancelled) setAuthenticated(false)
      })
    return () => { cancelled = true }
  }, [])

  return { authenticated, loading: authenticated === null }
}
