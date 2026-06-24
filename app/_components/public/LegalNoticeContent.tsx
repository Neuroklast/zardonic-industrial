import type { LegalConfig } from '@/lib/legal-content'
import { buildLegalNoticeSections } from '@/lib/legal-templates'
import { LegalDocumentContent } from './LegalDocumentContent'

interface LegalNoticeContentProps {
  config: LegalConfig
}

export function LegalNoticeContent({ config }: LegalNoticeContentProps) {
  const sections = buildLegalNoticeSections(config)
  const isCustom = Boolean(config.legalNoticeCustom)

  return (
    <LegalDocumentContent
      title="Legal Notice"
      streamLabel="// LEGAL.INFORMATION"
      sections={sections}
      isCustom={isCustom}
    />
  )
}