'use server'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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
  })
}

function buildPublicUrl(objectPath: string): string {
  const host = process.env.R2_PUBLIC_HOST ?? ''
  return `${host.replace(/\/$/, '')}/${objectPath}`
}

/** Generate a signed PUT URL for client-side direct upload to R2. */
export async function createSignedUploadUrl(
  bucket: string,
  path: string,
): Promise<{ url: string; objectPath: string; publicUrl: string }> {
  const client = buildR2Client()
  const objectPath = `${path}-${Date.now()}`
  const command = new PutObjectCommand({ Bucket: bucket, Key: objectPath })
  const url = await getSignedUrl(client, command, { expiresIn: 3600 })
  return { url, objectPath, publicUrl: buildPublicUrl(objectPath) }
}

/**
 * Upload a buffer (e.g. downloaded artwork) directly to R2 from the server.
 * Returns the public URL and the R2 object path.
 */
export async function uploadBufferToR2(
  bucket: string,
  objectPath: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ publicUrl: string; objectPath: string }> {
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
