export interface StorageObject {
  name: string
  size: number
  lastModified: Date
  contentType?: string
}

export interface StorageProvider {
  getPublicUrl(bucket: string, path: string): string
  createSignedUploadUrl(
    bucket: string,
    path: string,
  ): Promise<{ signedUrl: string; token: string; path: string }>
  createSignedDownloadUrl(bucket: string, path: string, expiresInSec: number): Promise<string>
  uploadObject(bucket: string, path: string, body: Buffer | Uint8Array | Blob, contentType: string): Promise<void>
  deleteObject(bucket: string, path: string): Promise<void>
  listObjects(bucket: string, prefix?: string): Promise<StorageObject[]>
}
