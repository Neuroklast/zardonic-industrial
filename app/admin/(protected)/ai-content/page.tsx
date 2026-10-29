import { requireAdmin } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { ReviewSlider, type ContentReviewRow } from './ReviewSlider'

export default async function AiContentReviewPage() {
  await requireAdmin()
  const admin = createAdminClient()
  const [pendingResult, historyResult] = await Promise.all([
    admin.from('mcp_content_requests')
      .select('id, collection, operation, target_id, target_key, changes, previous_snapshot, status, created_at, requested_by, reviewed_at, error')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(500),
    admin.from('mcp_content_requests')
      .select('id, collection, operation, target_id, target_key, changes, previous_snapshot, status, created_at, requested_by, reviewed_at, error')
      .neq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-3 overflow-hidden">
      <header className="shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-400">AI / Editorial</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">Content Review</h1>
        <p className="mt-1 hidden text-xs text-zinc-400 sm:block">
          Changes require MFA approval. New content stays unpublished until activated in the admin.
        </p>
      </header>
      {pendingResult.error || historyResult.error ? (
        <div role="alert" className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
          Review requests could not be loaded. Check the database connection and reload this page.
        </div>
      ) : (
        <ReviewSlider
          initialPending={(pendingResult.data ?? []) as ContentReviewRow[]}
          recentDecisions={(historyResult.data ?? []) as ContentReviewRow[]}
        />
      )}
    </div>
  )
}
