import type { Metadata } from 'next'
import { createClient } from '@/lib/supabaseServer'
import { DEFAULT_LEGAL_CONFIG, loadLegalConfig, type LegalConfig } from '@/lib/legal-content'
import { LegalPageShell } from '@/app/_components/public/LegalPageShell'
import { PrivacyPolicyContent } from '@/app/_components/public/PrivacyPolicyContent'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy and data protection information for this website.',
}

export const revalidate = 60

export default async function PrivacyPolicyPage() {
  let config: LegalConfig = DEFAULT_LEGAL_CONFIG

  try {
    const supabase = await createClient()
    config = await loadLegalConfig(supabase)
  } catch {
    // defaults
  }

  return (
    <LegalPageShell>
      <PrivacyPolicyContent config={config} />
    </LegalPageShell>
  )
}