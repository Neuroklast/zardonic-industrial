'use server'

import { revalidatePath } from 'next/cache'
import { runAdminAction } from '@/app/admin/_actions/auth'
import {
  createSupabaseActionContext,
  dispatchAdminActionAsAdmin,
} from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import {
  applyMediaHostRewrite,
  type MediaHostRewriteResult,
  type MediaRewriteClient,
} from '@/lib/r2-url-rewrite'

export type RewriteMediaHostsResult = MediaHostRewriteResult | { error: string }

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

async function runRewrite(dryRun: boolean): Promise<RewriteMediaHostsResult> {
  const dispatchResult = dispatchAdminActionAsAdmin(
    'rewrite_media_hosts',
    { dryRun },
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const publicHost = process.env.R2_PUBLIC_HOST ?? ''
    const result = await applyMediaHostRewrite(asRewriteClient(), {
      publicHost,
      mediaBucket: process.env.R2_BUCKET_MEDIA,
      dryRun,
    })
    if (!dryRun) revalidateMediaPaths()
    return result
  }, 'Unable to rewrite media hosts.')
}

export async function previewMediaHostRewrite(): Promise<RewriteMediaHostsResult> {
  return runRewrite(true)
}

export async function applyMediaHostRewriteAction(): Promise<RewriteMediaHostsResult> {
  return runRewrite(false)
}
