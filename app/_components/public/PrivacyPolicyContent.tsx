'use client'

import type { LegalConfig } from '@/lib/legal-content'
import {
  buildPrivacyPolicySections,
  privacyPolicyTitle,
  resolveLegalLocale,
} from '@/lib/legal-templates'
import { useLocale } from '@/contexts/LocaleContext'
import { LegalDocumentContent } from './LegalDocumentContent'

interface PrivacyPolicyContentProps {
  config: LegalConfig
}

export function PrivacyPolicyContent({ config }: PrivacyPolicyContentProps) {
  const { locale } = useLocale()
  const legalLocale = resolveLegalLocale(locale)
  const sections = buildPrivacyPolicySections(config, legalLocale)
  const isCustom = Boolean(config.privacyPolicyCustom)

  return (
    <LegalDocumentContent
      title={privacyPolicyTitle(legalLocale)}
      streamLabel={legalLocale === 'de' ? '// DATENSCHUTZ' : '// PRIVACY.POLICY'}
      sections={sections}
      isCustom={isCustom}
    />
  )
}
