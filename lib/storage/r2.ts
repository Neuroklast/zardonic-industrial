import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { StorageObject, StorageProvider } from './types'

function encodePathSegments(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

function normalizeR2Host(raw: string): string {
  const withoutProtocol = raw.replace(/^https?:\/\//i, '')
  return withoutProtocol.replace(/\/+$/, '')
}

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.',
    )
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

const _R2_PUBLIC_HOST: string | undefined = process.env.R2_PUBLIC_HOST

export const r2StorageProvider: StorageProvider = {
  getPublicUrl(_bucket: string, path: string): string {
    const raw = _R2_PUBLIC_HOST
    if (!raw) throw new Error('Missing R2_PUBLIC_HOST environment variable')
    const host = normalizeR2Host(raw)
    return `https://${host}/${encodePathSegments(path)}`
  },

  async createSignedUploadUrl(bucket: string, path: string) {
    const client = getR2Client()
    const command = new PutObjectCommand({ Bucket: bucket, Key: path })
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 300 })
    return { signedUrl, token: '', path }
  },

  async createSignedDownloadUrl(bucket: string, path: string, expiresInSec: number) {
    const client = getR2Client()
    const command = new GetObjectCommand({ Bucket: bucket, Key: path })
    return getSignedUrl(client, command, { expiresIn: expiresInSec })
  },

  async uploadObject(bucket: string, path: string, body: Buffer | Uint8Array | Blob, contentType: string) {
    const client = getR2Client()
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      Body: body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : body,
      ContentType: contentType,
    })
    await client.send(command)
  },

  async deleteObject(bucket: string, path: string) {
    const client = getR2Client()
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: path })
    await client.send(command)
  },

  async listObjects(bucket: string, prefix?: string) {
    const client = getR2Client()
    const command = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
    const response = await client.send(command)
    const contents = response.Contents ?? []
    return contents.map((item): StorageObject => ({
      name: item.Key ?? '',
      size: item.Size ?? 0,
      lastModified: item.LastModified ?? new Date(),
    }))
  },
}
