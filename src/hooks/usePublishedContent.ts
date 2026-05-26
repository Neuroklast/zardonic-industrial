import { useQuery } from '@tanstack/react-query'
import { API_ROUTES } from '@/lib/api-routes'

interface ContentResponse<T> {
  value: T | null
  source: 'draft' | 'published' | 'none'
}

/**
 * Read-only hook for public page content.
 * Returns the published value immediately or `fallback` while loading / on error.
 *
 * For richer state (loading/error) use `usePublishedContentFull`.
 */
export function usePublishedContent<T>(key: string, fallback: T): T {
  const { data } = usePublishedContentFull<T>(key)
  return data ?? fallback
}

/**
 * Full-state variant of `usePublishedContent`.
 * Returns `{ data, isLoading, error }` so callers can distinguish a real null
 * value from a fetch failure or pending request.
 */
export function usePublishedContentFull<T>(key: string): {
  data: T | null
  isLoading: boolean
  error: Error | null
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cms-published', key],
    queryFn: async (): Promise<ContentResponse<T>> => {
      const params = new URLSearchParams({ key, draft: 'false' })
      const res = await fetch(`${API_ROUTES.CMS_CONTENT}?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Failed to load content: ${res.status}`)
      return res.json() as Promise<ContentResponse<T>>
    },
    staleTime: 5 * 60_000, // 5 minutes
    retry: 1,
  })

  return {
    data: data?.value ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
  }
}
