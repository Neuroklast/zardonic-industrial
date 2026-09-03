import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { isAdminSession } from '@/lib/api-admin-auth'
import { listAllR2ObjectKeys } from '@/lib/r2-inventory'
import { applyR2MediaReconcile } from '@/lib/r2-reconcile'
import { createAdminClient } from '@/lib/supabaseAdmin'
import type { MediaRewriteClient } from '@/lib/r2-url-rewrite'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Admin utility: list the current R2 bucket and rewrite DB URLs whose
 * filename matches an object but the stored host/path is stale.
 *
 * POST /api/r2-reconcile          apply
 * POST /api/r2-reconcile?dryRun=1 preview
 */
export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  const admin = await isAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1'
  const publicHost = process.env.R2_PUBLIC_HOST ?? ''

  try {
    const objectKeys = await listAllR2ObjectKeys({
      bucket: process.env.R2_BUCKET_MEDIA,
    })
    const result = await applyR2MediaReconcile(
      createAdminClient() as unknown as MediaRewriteClient,
      {
        publicHost,
        objectKeys,
        mediaBucket: process.env.R2_BUCKET_MEDIA,
        dryRun,
      },
    )
    if (!dryRun) {
      revalidatePath('/')
      revalidatePath('/admin', 'layout')
      revalidatePath('/news', 'layout')
      revalidatePath('/releases')
      revalidatePath('/gigs')
      revalidatePath('/media')
    }
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reconcile failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
