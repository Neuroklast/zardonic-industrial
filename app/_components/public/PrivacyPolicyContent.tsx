import type { LegalConfig } from '@/lib/legal-content'
import { buildPrivacyPolicySections } from '@/lib/legal-templates'
import { LegalDocumentContent } from './LegalDocumentContent'

interface PrivacyPolicyContentProps {
  config: LegalConfig
}

export function PrivacyPolicyContent({ config }: PrivacyPolicyContentProps) {
  const sections = buildPrivacyPolicySections(config)
  const isCustom = Boolean(config.privacyPolicyCustom)

  return (
    <LegalDocumentContent
      title="Privacy Policy"
      streamLabel="// PRIVACY.POLICY"
      sections={sections}
      isCustom={isCustom}
    />
  )
}