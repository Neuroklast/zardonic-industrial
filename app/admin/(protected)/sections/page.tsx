import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { parseSections } from '@/lib/site-config-sections'
import { SectionsSortable } from './SectionsSortable'

export default async function SectionsPage() {
  let sections = parseSections(null)
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'sections')
      .single()
    if (data?.value) {
      sections = parseSections(data.value)
    }
  } catch {
    // ignore – use defaults
  }

  return (
    <div>
      <AdminPageHeader
        title="Section Visibility & Order"
        description="Drag sections to reorder them on the frontpage. Toggle visibility to hide a section without deleting its content."
      />
      <SectionsSortable initialSections={sections} />
    </div>
  )
}