'use server'

import { revalidatePath } from 'next/cache'
import { runAdminAction } from '@/app/admin/_actions/auth'
import {
  createSupabaseActionContext,
  dispatchAdminActionAsAdmin,
} from '@/app/admin/_actions/context'
import { listAllR2ObjectKeys } from '@/lib/r2-inventory'
import { applyR2MediaReconcile, type R2ReconcileResult } from '@/lib/r2-reconcile'
import { createAdminClient } from '@/lib/supabaseAdmin'
import type { MediaRewriteClient } from '@/lib/r2-url-rewrite'

export type R2ReconcileActionResult = R2ReconcileResult | { error: string }

function asRewriteClient(): MediaRewriteClient {
  return createAdminClient() as unknown as MediaRewriteClient
}

function revalidateMediaPaths() {
  revalidatePath('/')
  revalidatePath('/admin', 'layout')
  revalidatePath('/news', 'layout')
  revalidatePath('/releases')
  revalidatePath('/gigs')
  revalidatePath('/media')
  revalidatePath('/legal-notice')
  revalidatePath('/privacy-policy')
}

async function runReconcile(dryRun: boolean): Promise<R2ReconcileActionResult> {
  const dispatchResult = dispatchAdminActionAsAdmin(
    'reconcile_r2_media',
    { dryRun },
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const publicHost = process.env.R2_PUBLIC_HOST ?? ''
    const objectKeys = await listAllR2ObjectKeys({
      bucket: process.env.R2_BUCKET_MEDIA,
    })
    const result = await applyR2MediaReconcile(asRewriteClient(), {
      publicHost,
      objectKeys,
      mediaBucket: process.env.R2_BUCKET_MEDIA,
      dryRun,
    })
    if (!dryRun) revalidateMediaPaths()
    return result
  }, 'Unable to reconcile R2 media with the database.')
}

export async function previewR2MediaReconcile(): Promise<R2ReconcileActionResult> {
  return runReconcile(true)
}

export async function applyR2MediaReconcileAction(): Promise<R2ReconcileActionResult> {
  return runReconcile(false)
}
