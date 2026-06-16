export function isVercelBlobUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.hostname.includes('blob.vercel-storage.com')
  } catch {
    return false
  }
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
