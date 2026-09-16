import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { PartnerBulkImportClient } from './PartnerBulkImportClient'

export default async function PartnerBulkImportPage() {
  let existing: Array<{ name: string; category: string }> = []

  try {
    const supabase = await createClient()
    const { data } = await supabase.from('partners').select('name, category')
    existing = data ?? []
  } catch {
    // use empty list
  }

  return (
    <div>
      <AdminPageHeader
        title="Bulk import credits & partners"
        description="Add many credits, endorsements and partners at once. Drop logo files with text and URL per row, or paste a list. Existing names in the same section are skipped."
        action={
          <Link
            href="/admin/partners"
            className="px-3 py-1.5 text-sm rounded border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            ← Credits &amp; Partners
          </Link>
        }
      />
      <PartnerBulkImportClient existing={existing} />
    </div>
  )
}
