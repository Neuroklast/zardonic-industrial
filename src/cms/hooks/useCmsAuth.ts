import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { API_ROUTES } from '@/lib/api-routes'

interface AuthStatus {
  authenticated: boolean
  needsSetup: boolean
  totpEnabled: boolean
}

interface UseCmsAuthResult {
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
}

export function useCmsAuth(): UseCmsAuthResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const res = await fetch(API_ROUTES.AUTH, { credentials: 'include' })
        if (!res.ok) {
          if (!cancelled) setIsAuthenticated(false)
          return
        }
        const data: AuthStatus = await res.json() as AuthStatus
        if (!cancelled) setIsAuthenticated(data.authenticated)
      } catch {
        if (!cancelled) setIsAuthenticated(false)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void checkSession()
    return () => { cancelled = true }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch(API_ROUTES.AUTH, {
        method: 'DELETE',
        credentials: 'include',
      })
      setIsAuthenticated(false)
    } catch {
      toast.error('Logout failed. Please try again.')
    }
  }, [])

  return { isAuthenticated, isLoading, logout }
}
