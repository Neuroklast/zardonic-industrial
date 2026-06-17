import { useEffect, useState, useCallback } from 'react'

interface UseInstagramFeedOptions {
  /** Instagram Basic Display API access token */
  accessToken: string | undefined
  /** Whether to enable fetching (defaults to true if token is set) */
  enabled?: boolean
  /** Max images to fetch (default: 12) */
  maxImages?: number
}

interface UseInstagramFeedResult {
  images: string[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * useInstagramFeed — fetches images from the Instagram Basic Display API
 * via the /api/instagram proxy endpoint.
 *
 * Only fetches when `enabled` is true and an `accessToken` is provided.
 */
export function useInstagramFeed({
  accessToken,
  enabled = true,
  maxImages = 12,
}: UseInstagramFeedOptions): UseInstagramFeedResult {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triggerCount, setTriggerCount] = useState(0)

  const refetch = useCallback(() => {
    setTriggerCount(c => c + 1)
  }, [])

  useEffect(() => {
    // When disabled or no token, clear state asynchronously to avoid cascading renders
    if (!enabled || !accessToken) {
      const id = setTimeout(() => {
        setImages([])
        setLoading(false)
        setError(null)
      }, 0)
      return () => clearTimeout(id)
    }

    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)

    const params = new URLSearchParams({
      token: accessToken,
      limit: String(maxImages),
    })

    fetch(`/api/instagram?${params.toString()}`)
      .then(async (res) => {
        const body = await res.json() as { images?: string[]; error?: string }
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
        return body.images ?? []
      })
      .then((imgs) => {
        if (!cancelled) {
          setImages(imgs)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Instagram feed')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, enabled, maxImages, triggerCount])

  return { images, loading, error, refetch }
}
