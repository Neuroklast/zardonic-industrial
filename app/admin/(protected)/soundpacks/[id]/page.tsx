import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import EditSoundpackForm from './EditSoundpackForm'

interface SoundpackItem {
  id: string
  title: string
  image_storage_path: string | null
  image_url: string | null
  external_url: string | null
  display_order: number
}

export default async function EditSoundpackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('soundpacks').select('*').eq('id', id).single()
  if (!data) notFound()

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">Edit Soundpack</h1>
      <EditSoundpackForm item={data as SoundpackItem} />
    </div>
  )
}
