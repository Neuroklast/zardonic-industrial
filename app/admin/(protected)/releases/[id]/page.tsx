import { createClient } from '@/lib/supabaseServer'
import { resolveImageUrl } from '@/lib/r2'
import { notFound } from 'next/navigation'
import EditReleaseForm from './EditReleaseForm'

export default async function EditReleasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data } = await supabase.from('releases').select('*').eq('id', id).single()

  if (!data) notFound()

  const row = data as Record<string, unknown>
  const resolvedCoverUrl = resolveImageUrl(
    row.cover_storage_path as string | null,
    row.cover_url as string | null,
  )

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Edit Release</h1>
      <EditReleaseForm release={row} resolvedCoverUrl={resolvedCoverUrl} />
    </div>
  )
}
