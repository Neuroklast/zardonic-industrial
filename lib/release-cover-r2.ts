import { MEDIA_BUCKET } from '@/lib/constants'
import { getStorageProvider } from '@/lib/storage'

const RELEASE_COVER_PREFIX = 'releases/'

function normalizePath(path: string): string | null {
  const trimmed = path.trim()
  if (!trimmed.startsWith(RELEASE_COVER_PREFIX)) return null
  return trimmed
}

/** Delete orphaned release cover objects from R2 after consolidation or replacement. */
export async function deleteReleaseCoversFromR2(
  paths: Iterable<string>,
): Promise<{ deleted: string[]; errors: string[] }> {
  const deleted: string[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  let storage: ReturnType<typeof getStorageProvider> | null = null
  try {
    storage = getStorageProvider()
  } catch {
    return { deleted, errors }
  }

  for (const raw of paths) {
    const path = normalizePath(raw)
    if (!path || seen.has(path)) continue
    seen.add(path)

    try {
      await storage.deleteObject(MEDIA_BUCKET, path)
      deleted.push(path)
    } catch {
      errors.push(path)
    }
  }

  return { deleted, errors }
}