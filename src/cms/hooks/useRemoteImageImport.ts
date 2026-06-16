import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { API_ROUTES } from '@/lib/api-routes'

interface ImageImportResponse {
  url: string
  fileName: string
  mimeType: string
  size: number
}

interface UseRemoteImageImportResult {
  importFromUrl: (url: string) => Promise<ImageImportResponse | null>
  isImporting: boolean
}

export function useRemoteImageImport(): UseRemoteImageImportResult {
  const [isImporting, setIsImporting] = useState(false)

  const importFromUrl = useCallback(async (url: string): Promise<ImageImportResponse | null> => {
    setIsImporting(true)
    try {
      const response = await fetch(API_ROUTES.CMS_IMAGE_IMPORT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const payload = await response.json().catch(() => ({})) as {
        error?: string
        url?: string
        fileName?: string
        mimeType?: string
        size?: number
      }

      if (!response.ok || !payload.url || !payload.fileName || !payload.mimeType || typeof payload.size !== 'number') {
        throw new Error(payload.error ?? 'Image import failed.')
      }

      toast.success('Image imported to Blob storage.')
      return {
        url: payload.url,
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        size: payload.size,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image import failed.'
      toast.error(message)
      return null
    } finally {
      setIsImporting(false)
    }
  }, [])

  return { importFromUrl, isImporting }
}
