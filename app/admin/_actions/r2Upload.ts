'use server'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function createSignedUploadUrl(
  bucket: string,
  path: string,
): Promise<{ url: string; objectPath: string; publicUrl: string }> {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 credentials')
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })

  const objectPath = `${path}-${Date.now()}`
  const command = new PutObjectCommand({ Bucket: bucket, Key: objectPath })
  const url = await getSignedUrl(client, command, { expiresIn: 3600 })
  const host = process.env.R2_PUBLIC_HOST ?? ''
  const publicUrl = `${host.replace(/\/$/, '')}/${objectPath}`
  return { url, objectPath, publicUrl }
}
