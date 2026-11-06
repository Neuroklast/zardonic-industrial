import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { isValidContentObjectKey } from '@/lib/r2-object-key'

export interface CompletedPart {
  PartNumber: number
  ETag: string
}

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 credentials.')
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
  })
}

export async function createMultipartUpload(
  bucket: string,
  key: string,
  contentType: string,
): Promise<{ uploadId: string }> {
  if (!isValidContentObjectKey(key) || !/^(image|video|audio|application)\//.test(contentType)) {
    throw new Error('Invalid multipart media target')
  }
  const client = getR2Client()
  const command = new CreateMultipartUploadCommand({ Bucket: bucket, Key: key, ContentType: contentType })
  const response = await client.send(command)
  if (!response.UploadId) throw new Error('Failed to create multipart upload: no UploadId returned')
  return { uploadId: response.UploadId }
}

export async function signMultipartPart(
  bucket: string,
  key: string,
  uploadId: string,
  partNumber: number,
): Promise<{ signedUrl: string }> {
  if (!isValidContentObjectKey(key) || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
    throw new Error('Invalid multipart part')
  }
  const client = getR2Client()
  const command = new UploadPartCommand({ Bucket: bucket, Key: key, UploadId: uploadId, PartNumber: partNumber })
  const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
  return { signedUrl }
}

export async function completeMultipartUpload(
  bucket: string,
  key: string,
  uploadId: string,
  parts: CompletedPart[],
): Promise<void> {
  if (!isValidContentObjectKey(key) || !Array.isArray(parts) || parts.length < 1 || parts.length > 10000 ||
      parts.some((part) => !Number.isInteger(part.PartNumber) || part.PartNumber < 1 || part.PartNumber > 10000 ||
        typeof part.ETag !== 'string' || part.ETag.length < 1 || part.ETag.length > 255)) {
    throw new Error('Invalid multipart completion')
  }
  const client = getR2Client()
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts.map((p) => ({ PartNumber: p.PartNumber, ETag: p.ETag })) },
  })
  await client.send(command)
}

export async function abortMultipartUpload(
  bucket: string,
  key: string,
  uploadId: string,
): Promise<void> {
  if (!isValidContentObjectKey(key) || !uploadId || uploadId.length > 512) {
    throw new Error('Invalid multipart abort request')
  }
  const client = getR2Client()
  const command = new AbortMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: uploadId })
  await client.send(command)
}
