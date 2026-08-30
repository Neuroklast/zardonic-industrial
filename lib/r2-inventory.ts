import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'

export const R2_INVENTORY_MAX_KEYS = 20_000

export interface R2Inventory {
  keys: Set<string>
  byFilename: Map<string, string[]>
}

export function objectFilename(objectKey: string): string {
  const trimmed = objectKey.replace(/\/+$/, '')
  const slash = trimmed.lastIndexOf('/')
  return slash >= 0 ? trimmed.slice(slash + 1) : trimmed
}

/** Include `file.webp-1712345678901` and `file.webp` (signed-upload timestamp suffix). */
export function filenameMatchKeys(objectKey: string): string[] {
  const base = objectFilename(objectKey)
  if (!base) return []
  const names = new Set([base])
  const stripped = base.replace(/-\d{10,}$/, '')
  if (stripped && stripped !== base) names.add(stripped)
  return [...names]
}

export function buildR2Inventory(keys: readonly string[]): R2Inventory {
  const keySet = new Set<string>()
  const byFilename = new Map<string, string[]>()

  for (const raw of keys) {
    const key = raw.trim()
    if (!key || key.endsWith('/')) continue
    keySet.add(key)
    for (const name of filenameMatchKeys(key)) {
      const list = byFilename.get(name) ?? []
      list.push(key)
      byFilename.set(name, list)
    }
  }

  return { keys: keySet, byFilename }
}

export type InventoryMatch =
  | { status: 'matched'; key: string; via: 'exact' | 'suffix' | 'filename' }
  | { status: 'missing' }
  | { status: 'ambiguous'; candidates: string[] }

export function matchInventoryKey(
  storedPath: string | null,
  inventory: R2Inventory,
): InventoryMatch {
  if (storedPath) {
    if (inventory.keys.has(storedPath)) {
      return { status: 'matched', key: storedPath, via: 'exact' }
    }
    const suffixHits = [...inventory.keys].filter(
      (key) => key.endsWith(`/${storedPath}`) || key === storedPath,
    )
    if (suffixHits.length === 1) {
      return { status: 'matched', key: suffixHits[0], via: 'suffix' }
    }
  }

  const filename = storedPath ? objectFilename(storedPath) : ''
  const names = filename ? filenameMatchKeys(filename) : []
  for (const name of names) {
    const hits = inventory.byFilename.get(name) ?? []
    if (hits.length === 1) {
      return { status: 'matched', key: hits[0], via: 'filename' }
    }
    if (storedPath && hits.length > 1) {
      const tighter = hits.filter(
        (key) => key.endsWith(`/${storedPath}`) || key.endsWith(storedPath),
      )
      if (tighter.length === 1) {
        return { status: 'matched', key: tighter[0], via: 'suffix' }
      }
      if (tighter.length > 1) {
        return { status: 'ambiguous', candidates: tighter.slice(0, 8) }
      }
    }
    if (hits.length > 1) {
      return { status: 'ambiguous', candidates: hits.slice(0, 8) }
    }
  }

  return { status: 'missing' }
}

export async function listAllR2ObjectKeys(options?: {
  bucket?: string
  maxKeys?: number
}): Promise<string[]> {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = options?.bucket ?? process.env.R2_BUCKET_MEDIA
  const maxKeys = options?.maxKeys ?? R2_INVENTORY_MAX_KEYS

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'Missing R2 credentials: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_MEDIA',
    )
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })

  const keys: string[] = []
  let token: string | undefined
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    )
    for (const item of response.Contents ?? []) {
      if (item.Key && !item.Key.endsWith('/')) keys.push(item.Key)
      if (keys.length >= maxKeys) return keys
    }
    token = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (token)

  return keys
}
