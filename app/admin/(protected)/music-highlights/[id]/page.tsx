import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import EditMusicHighlightForm from './EditMusicHighlightForm'

export default async function EditMusicHighlightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('music_highlights')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">Edit Music Highlight</h1>
      <EditMusicHighlightForm item={data as { id: string; title: string; youtube_url: string; description: string | null; display_order: number }} />
    </div>
  )
}
