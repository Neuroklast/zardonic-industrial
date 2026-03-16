import { useState, useEffect } from 'react'
import { cacheImage, toDirectImageUrl } from '@/lib/image-cache'

function isLocalUrl(url: string): boolean {
  return (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('/') ||
    url.startsWith('./') ||
    url.startsWith('../') ||
    !url.includes('://')
  )
}

export function useCachedImage(url: string | undefined): string {
  const [cached, setCached] = useState<{ url: string; result: string } | null>(null)

  useEffect(() => {
    if (!url || isLocalUrl(url)) return

    let cancelled = false
    cacheImage(url).then(result => {
      if (!cancelled) setCached({ url, result })
    })
    return () => {
      cancelled = true
    }
  }, [url])

  if (!url) return ''
  if (isLocalUrl(url)) return url
  if (cached?.url === url) return cached.result
  return toDirectImageUrl(url)
}
