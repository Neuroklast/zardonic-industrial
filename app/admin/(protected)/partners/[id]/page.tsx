import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { resolveImageUrl } from '@/lib/r2'
import { EditPartnerForm } from './EditPartnerForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPartnerPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: partner } = await supabase
    .from('partners')
    .select('id, name, url, category, logo_storage_path, logo_url, display_order, active, logo_hover_white')
    .eq('id', id)
    .single()

  if (!partner) notFound()

  const resolvedLogoUrl = resolveImageUrl(partner.logo_storage_path, partner.logo_url)

  return (
    <div>
      <Link href="/admin/partners" className="text-zinc-500 hover:text-white text-sm">
        ← Partners
      </Link>
      <h1 className="text-xl font-bold mt-4 mb-6">Edit Partner</h1>
      <EditPartnerForm partner={partner} resolvedLogoUrl={resolvedLogoUrl} />
    </div>
  )
}