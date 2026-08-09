import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import SocialLinksClient, { type SocialLinkRow } from './SocialLinksClient'

export default async function SocialPage() {
  let links: SocialLinkRow[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('social_links')
      .select('id, platform, url, label, display_order, logo_storage_path, logo_url')
      .order('display_order', { ascending: true })
    links = (data ?? []) as SocialLinkRow[]
  } catch {
    // ignore — empty list
  }

  return (
    <div className="max-w-2xl">
      <AdminPageHeader
        title="Social Links"
        description="Manage footer and connect links. Drag to reorder. Optional custom logos replace default platform icons."
      />
      <SocialLinksClient initialLinks={links} />
    </div>
  )
}
