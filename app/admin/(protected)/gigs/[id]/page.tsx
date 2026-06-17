import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import EditGigForm from './EditGigForm'

export default async function EditGigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('gigs').select('*').eq('id', id).single()
  if (!data) notFound()
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Edit Gig</h1>
      <EditGigForm gig={data as Record<string, unknown>} />
    </div>
  )
}
