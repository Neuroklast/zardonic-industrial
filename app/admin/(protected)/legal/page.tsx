import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { LegalConfigEditor } from './LegalConfigEditor'

export default async function LegalAdminPage() {
  let legalValue: Record<string, unknown> = {}

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'legal')
      .maybeSingle()
    if (data?.value && typeof data.value === 'object') {
      legalValue = data.value as Record<string, unknown>
    }
  } catch {
    // defaults
  }

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Legal & Privacy"
        description="Configure operator details and your privacy policy. Structured fields are injected into the default legal templates on /legal-notice and /privacy-policy."
      />
      <LegalConfigEditor currentValue={legalValue} />
    </div>
  )
}