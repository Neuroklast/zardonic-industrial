import { createClient } from '@/lib/supabaseServer'
import { deletePartner } from '@/app/admin/_actions/partners'
import PartnerForm from './PartnerForm'

export default async function PartnersPage() {
  let partners: Array<{ id: string; name: string; url: string | null; category: string; display_order: number }> = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('partners')
      .select('id, name, url, category, display_order')
      .order('display_order', { ascending: true })
    partners = data ?? []
  } catch {
    // ignore
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Partners & Friends</h1>
      <div className="mb-8">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">Add Partner</h2>
        <PartnerForm />
      </div>
      {partners.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Existing Partners</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="text-left py-2 pr-4">Name</th>
                <th className="text-left py-2 pr-4">Category</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id} className="border-b border-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-200">{partner.name}</td>
                  <td className="py-2 pr-4 text-zinc-400">{partner.category}</td>
                  <td className="py-2 text-right">
                    <form action={async () => { 'use server'; await deletePartner(partner.id) }}>
                      <button type="submit" className="text-red-400 hover:text-red-300 text-xs transition-colors">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
