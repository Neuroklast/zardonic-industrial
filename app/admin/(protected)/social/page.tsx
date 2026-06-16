import { createClient } from '@/lib/supabaseServer'
import { deleteSocialLink } from '@/app/admin/_actions/social'
import SocialForm from './SocialForm'

export default async function SocialPage() {
  let links: Array<{ id: string; platform: string; url: string; label: string | null; display_order: number }> = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('social_links')
      .select('id, platform, url, label, display_order')
      .order('display_order', { ascending: true })
    links = data ?? []
  } catch {
    // ignore
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Social Links</h1>
      <div className="mb-8">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">Add New Link</h2>
        <SocialForm />
      </div>
      {links.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Existing Links</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="text-left py-2 pr-4">Platform</th>
                <th className="text-left py-2 pr-4">URL</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b border-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-200">{link.platform}</td>
                  <td className="py-2 pr-4 text-zinc-400 truncate max-w-xs">{link.url}</td>
                  <td className="py-2 text-right">
                    <form action={async () => { 'use server'; await deleteSocialLink(link.id) }}>
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
