'use server'

import { requireAdmin } from '@/app/admin/_actions/auth'
import {
  createMultipartUpload,
  signMultipartPart,
  completeMultipartUpload,
  abortMultipartUpload,
} from '@/lib/storage/r2-multipart'
import type { CompletedPart } from '@/lib/storage/r2-multipart'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'

export async function createMultipartUploadAction(
  key: string,
  contentType: string,
): Promise<{ uploadId: string }> {
  await requireAdmin()
  return createMultipartUpload(MEDIA_BUCKET, key, contentType)
}

export async function signMultipartPartAction(
  key: string,
  uploadId: string,
  partNumber: number,
): Promise<{ signedUrl: string }> {
  await requireAdmin()
  return signMultipartPart(MEDIA_BUCKET, key, uploadId, partNumber)
}

export async function completeMultipartUploadAction(
  key: string,
  uploadId: string,
  parts: CompletedPart[],
): Promise<void> {
  await requireAdmin()
  await completeMultipartUpload(MEDIA_BUCKET, key, uploadId, parts)
}

export async function abortMultipartUploadAction(
  key: string,
  uploadId: string,
): Promise<void> {
  await requireAdmin()
  await abortMultipartUpload(MEDIA_BUCKET, key, uploadId)
}
