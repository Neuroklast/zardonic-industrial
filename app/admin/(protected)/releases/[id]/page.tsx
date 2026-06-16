import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import EditReleaseForm from './EditReleaseForm'

export default async function EditReleasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data } = await supabase.from('releases').select('*').eq('id', id).single()

  if (!data) notFound()

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Edit Release</h1>
      <EditReleaseForm release={data as Record<string, unknown>} />
    </div>
  )
}
