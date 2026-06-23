import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
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
      <AdminPageHeader
        title="Biography"
        description="Edit the artist biography shown in the Bio section on the public site."
      />
      <BioForm initialContent={content} />
    </div>
  )
}
