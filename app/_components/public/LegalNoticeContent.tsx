'use client'

import type { LegalConfig } from '@/lib/legal-content'
import { getLegalCompleteness } from '@/lib/legal-content'
import {
  buildLegalNoticeSections,
  legalNoticeTitle,
  resolveLegalLocale,
} from '@/lib/legal-templates'
import { useLocale } from '@/contexts/LocaleContext'
import { LegalDocumentContent } from './LegalDocumentContent'

interface LegalNoticeContentProps {
  config: LegalConfig
}

export function LegalNoticeContent({ config }: LegalNoticeContentProps) {
  const { locale } = useLocale()
  const legalLocale = resolveLegalLocale(locale)
  const sections = buildLegalNoticeSections(config, legalLocale)
  const isCustom = Boolean(config.legalNoticeCustom)
  const completeness = getLegalCompleteness(config)

  return (
    <LegalDocumentContent
      title={legalNoticeTitle(legalLocale)}
      streamLabel={legalLocale === 'de' ? '// IMPRESSUM' : '// LEGAL.INFORMATION'}
      sections={sections}
      isCustom={isCustom}
      incomplete={!isCustom && !completeness.complete}
      incompleteMessage={
        legalLocale === 'de'
          ? 'Hinweis: Pflichtangaben im Impressum sind noch unvollständig. Bitte im Admin unter Legal & Privacy ergänzen.'
          : 'Notice: Required operator details are incomplete. Please complete them under Admin → Legal & Privacy.'
      }
    />
  )
}
