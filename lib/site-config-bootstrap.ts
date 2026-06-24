import { createClient } from '@/lib/supabaseServer'
import { parseAnalyticsConfig, type AnalyticsConfig } from '@/lib/analytics-config'
import { parseTranslationsConfig, type CustomTranslations } from '@/lib/translations-config'

export interface PublicSiteBootstrap {
  customTranslations: CustomTranslations
  analyticsConfig: AnalyticsConfig
}

export async function getPublicSiteBootstrap(): Promise<PublicSiteBootstrap> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_config')
      .select('key, value')
      .in('key', ['translations', 'analytics'])

    const rows = (data ?? []) as Array<{ key: string; value: unknown }>
    const rowMap = Object.fromEntries(rows.map((row) => [row.key, row.value]))
    return {
      customTranslations: parseTranslationsConfig(rowMap.translations),
      analyticsConfig: parseAnalyticsConfig(rowMap.analytics),
    }
  } catch {
    return {
      customTranslations: {},
      analyticsConfig: parseAnalyticsConfig(null),
    }
  }
}