import { createClient } from '@/lib/supabaseServer'
import { resolveImageUrl } from '@/lib/r2'
import Link from 'next/link'
import Image from 'next/image'
import { deletePartner } from '@/app/admin/_actions/partners'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import PartnerForm from './PartnerForm'
import { PartnerVisibilityToggle } from './PartnerVisibilityToggle'

export default async function PartnersPage() {
  let partners: Array<{
    id: string
    name: string
    url: string | null
    category: string
    display_order: number
    active: boolean
    logo_storage_path: string | null
    logo_url: string | null
  }> = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('partners')
      .select('id, name, url, category, display_order, active, logo_storage_path, logo_url')
      .order('display_order', { ascending: true })
    partners = data ?? []
  } catch {
    // ignore
  }

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Credits & Partners"
        description="Credits, endorsements and partners on the public site. Logos: upload, URL (R2 cache), or Google Drive."
      />
      <div className="mb-8">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">Add entry</h2>
        <PartnerForm />
      </div>
      {partners.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Existing entries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="text-left py-2 pr-4">Logo</th>
                  <th className="text-left py-2 pr-4">Name</th>
                  <th className="text-left py-2 pr-4">Section</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => {
                  const logoUrl = resolveImageUrl(partner.logo_storage_path, partner.logo_url)
                  return (
                    <tr key={partner.id} className="border-b border-zinc-800/50">
                      <td className="py-2 pr-4">
                        {logoUrl ? (
                          <div className="relative w-12 h-12 bg-zinc-900 rounded border border-zinc-800">
                            <Image
                              src={logoUrl}
                              alt=""
                              fill
                              className="object-contain p-1"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-zinc-200">{partner.name}</td>
                      <td className="py-2 pr-4 text-zinc-400 capitalize">{partner.category}</td>
                      <td className="py-2 pr-4">
                        <PartnerVisibilityToggle partnerId={partner.id} active={partner.active ?? true} />
                      </td>
                      <td className="py-2 text-right space-x-2">
                        <Link
                          href={`/admin/partners/${partner.id}`}
                          className="text-zinc-400 hover:text-white text-xs"
                        >
                          Edit
                        </Link>
                        <form action={async () => { 'use server'; await deletePartner(partner.id) }}>
                          <button type="submit" className="text-red-400 hover:text-red-300 text-xs">
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}