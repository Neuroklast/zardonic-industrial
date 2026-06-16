import { createClient } from '@/lib/supabaseServer'
import BioForm from './BioForm'

export default async function BioPage() {
  let content = ''
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('bio').select('content').limit(1).single()
    content = data?.content ?? ''
  } catch {
    // ignore
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Biography</h1>
      <BioForm initialContent={content} />
    </div>
  )
}
