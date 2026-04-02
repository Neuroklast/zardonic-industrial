/**
 * React Hook: useSanity
 *
 * Drop-in data fetching hook that loads data from Sanity Content Lake.
 * Replaces the legacy useKV hook for read-only (public) data.
 *
 * Returns [data, isLoading, error] — similar to TanStack Query pattern.
 */
import { useState, useEffect, useRef } from 'react'
import { sanityClient } from '@/lib/sanity.client'

/**
 * Generic hook that fetches data from Sanity using a GROQ query.
 *
 * @param query — GROQ query string
 * @param params — optional GROQ query parameters
 * @returns [data, isLoading, error]
 *
 * @example
 * ```ts
 * const [releases, loading] = useSanityQuery<Release[]>(releasesQuery)
 * ```
 */
export function useSanityQuery<T>(
  query: string,
  params?: Record<string, unknown>
): [T | undefined, boolean, Error | null] {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    sanityClient
      .fetch<T>(query, params ?? {})
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch((err: unknown) => {
        const fetchError = err instanceof Error ? err : new Error('Sanity fetch failed')
        console.error('[useSanityQuery] Error:', fetchError)
        setError(fetchError)
        setLoading(false)
      })
  }, [query, params])

  return [data, loading, error]
}
