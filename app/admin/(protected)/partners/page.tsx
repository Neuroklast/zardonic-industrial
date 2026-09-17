import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import PartnerForm from './PartnerForm'
import { PartnersSortable, type PartnerListRow } from './PartnersSortable'

export default async function PartnersPage() {
  let partners: PartnerListRow[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('partners')
      .select('id, name, url, category, display_order, active, logo_storage_path, logo_url')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
    partners = data ?? []
  } catch {
    // ignore
  }

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Credits & Partners"
        description="Credits, endorsements and partners on the public site. Drag rows to reorder each section. Logos: upload, URL (R2 cache), or Google Drive."
        action={
          <Link
            href="/admin/partners/bulk"
            className="px-3 py-1.5 text-sm rounded border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            Bulk import
          </Link>
        }
      />
      <div className="mb-8">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">Add entry</h2>
        <PartnerForm />
      </div>
      {partners.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Existing entries</h2>
          <PartnersSortable initialPartners={partners} />
        </div>
      )}
    </div>
  )
}
