import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import EditMerchandiseForm from './EditMerchandiseForm'

interface MerchandiseItem {
  id: string
  title: string
  image_storage_path: string | null
  image_url: string | null
  external_url: string | null
  display_order: number
}

export default async function EditMerchandisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('merchandise').select('*').eq('id', id).single()
  if (!data) notFound()

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">Edit Merchandise Item</h1>
      <EditMerchandiseForm item={data as MerchandiseItem} />
    </div>
  )
}
