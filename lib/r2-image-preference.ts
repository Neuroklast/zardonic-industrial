/** When R2 storage path is set, clear legacy external URL so resolveImageUrl prefers R2. */
export function preferR2StoragePath<T extends Record<string, unknown>>(
  data: T,
  storageKey: keyof T & string,
  urlKey: keyof T & string,
): T {
  if (data[storageKey]) {
    return { ...data, [urlKey]: null }
  }
  return data
}