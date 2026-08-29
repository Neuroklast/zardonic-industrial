'use server'

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireAdmin } from '@/app/admin/_actions/auth'
import { MEDIA_BUCKET } from '@/lib/constants'

function buildR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 credentials: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY must be set')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
}

function buildPublicUrl(objectPath: string): string {
  const host = process.env.R2_PUBLIC_HOST ?? ''
  return `${host.replace(/\/$/, '')}/${objectPath}`
}

export async function publicUrlForR2Object(
  objectPath: string,
): Promise<{ publicUrl: string }> {
  await requireAdmin()
  const path = objectPath.trim().replace(/^\/+/, '')
  if (!path || path.includes('..') || path.includes('\\')) {
    throw new Error('Invalid storage path')
  }
  return { publicUrl: buildPublicUrl(path) }
}

export async function createSignedUploadUrl(
  bucket: string,
  path: string,
): Promise<{ url: string; objectPath: string; publicUrl: string }> {
  await requireAdmin()
  const client = buildR2Client()
  const objectPath = `${path}-${Date.now()}`
  const command = new PutObjectCommand({ Bucket: bucket, Key: objectPath })
  const url = await getSignedUrl(client, command, { expiresIn: 3600 })
  return { url, objectPath, publicUrl: buildPublicUrl(objectPath) }
}

export async function uploadBufferToR2(
  bucket: string,
  objectPath: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ publicUrl: string; objectPath: string }> {
  await requireAdmin()
  const client = buildR2Client()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectPath,
      Body: buffer,
      ContentType: contentType,
    }),
  )
  return { publicUrl: buildPublicUrl(objectPath), objectPath }
}

/**
 * Delete an object from R2 media bucket.
 * Rejects path traversal and empty keys. Admin-only.
 */
export async function deleteR2MediaObject(
  objectPath: string,
  bucket: string = MEDIA_BUCKET,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()

  const path = objectPath.trim().replace(/^\/+/, '')
  if (!path || path.includes('..') || path.includes('\\')) {
    return { ok: false, error: 'Invalid storage path' }
  }

  try {
    const client = buildR2Client()
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: path,
      }),
    )
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed'
    return { ok: false, error: message }
  }
}
