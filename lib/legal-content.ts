import type { SupabaseClient } from '@supabase/supabase-js'

export interface LegalConfig {
  operatorName: string
  careOf?: string
  street: string
  zipCity: string
  country?: string
  phone?: string
  email: string
  vatId?: string
  responsibleName?: string
  responsibleAddress?: string
  privacyPolicyCustom?: string
  legalNoticeCustom?: string
}

export interface FooterConfig {
  legalNoticeUrl: string
  privacyPolicyUrl: string
}

export interface LegalSection {
  id: string
  title: string
  paragraphs: string[]
}

export const DEFAULT_LEGAL_CONFIG: LegalConfig = {
  operatorName: '',
  street: '',
  zipCity: '',
  country: 'Germany',
  email: '',
}

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  legalNoticeUrl: '/legal-notice',
  privacyPolicyUrl: '/privacy-policy',
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function parseLegalConfig(raw: unknown): LegalConfig {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {}

  return {
    operatorName: str(obj.operatorName) ?? '',
    careOf: str(obj.careOf),
    street: str(obj.street) ?? '',
    zipCity: str(obj.zipCity) ?? '',
    country: str(obj.country) ?? 'Germany',
    phone: str(obj.phone),
    email: str(obj.email) ?? '',
    vatId: str(obj.vatId),
    responsibleName: str(obj.responsibleName),
    responsibleAddress: str(obj.responsibleAddress),
    privacyPolicyCustom: str(obj.privacyPolicyCustom),
    legalNoticeCustom: str(obj.legalNoticeCustom),
  }
}

export function parseFooterConfig(raw: unknown): FooterConfig {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {}

  const legacyImpressum = str(obj.impressumUrl)
  const legacyPrivacy = str(obj.privacyUrl)

  return {
    legalNoticeUrl: str(obj.legalNoticeUrl) ?? legacyImpressum ?? DEFAULT_FOOTER_CONFIG.legalNoticeUrl,
    privacyPolicyUrl: str(obj.privacyPolicyUrl) ?? legacyPrivacy ?? DEFAULT_FOOTER_CONFIG.privacyPolicyUrl,
  }
}

/** Formats a service-of-process capable postal address (ladungsfähige Anschrift). */
export function formatServiceAddress(config: LegalConfig): string {
  const lines: string[] = []
  if (config.operatorName) lines.push(config.operatorName)
  if (config.careOf) lines.push(config.careOf)
  if (config.street) lines.push(config.street)
  if (config.zipCity) lines.push(config.zipCity)
  if (config.country) lines.push(config.country)
  return lines.join('\n')
}

export function getResponsibleName(config: LegalConfig): string {
  return config.responsibleName?.trim() || config.operatorName
}

export function getResponsibleAddress(config: LegalConfig): string {
  return config.responsibleAddress?.trim() || formatServiceAddress(config)
}

export function getDataControllerLabel(config: LegalConfig): string {
  if (config.operatorName && config.email) {
    return `${config.operatorName} (${config.email})`
  }
  return config.operatorName || config.email || 'the website operator'
}

export async function loadLegalConfig(
  supabase: SupabaseClient,
): Promise<LegalConfig> {
  const { data } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'legal')
    .maybeSingle()

  return parseLegalConfig(data?.value)
}

export async function loadFooterConfig(
  supabase: SupabaseClient,
): Promise<FooterConfig> {
  const { data } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'footer')
    .maybeSingle()

  return parseFooterConfig(data?.value)
}

interface SiteConfigRow {
  key: string
  value: unknown
}

export interface LegalPageData {
  legal: LegalConfig
  footer: FooterConfig
  appearance: Record<string, unknown>
  social: Array<{ id: string; platform: string; url: string; label: string | null }>
}

export async function loadLegalPageData(
  supabase: SupabaseClient,
): Promise<LegalPageData> {
  const [configResult, socialResult] = await Promise.all([
    supabase.from('site_config').select('key, value'),
    supabase.from('social_links').select('id, platform, url, label').order('display_order', { ascending: true }),
  ])

  const rows = (configResult.data ?? []) as SiteConfigRow[]
  const get = (key: string) => rows.find((r) => r.key === key)?.value

  return {
    legal: parseLegalConfig(get('legal')),
    footer: parseFooterConfig(get('footer')),
    appearance: (get('appearance') && typeof get('appearance') === 'object'
      ? get('appearance')
      : {}) as Record<string, unknown>,
    social: (socialResult.data ?? []) as LegalPageData['social'],
  }
}