import { createClient } from '@/lib/supabaseServer'
import { parseAnalyticsConfig, type AnalyticsConfig } from '@/lib/analytics-config'
import { parseLanguagesConfig } from '@/lib/languages-config'
import type { SiteLanguage } from '@/lib/i18n'
import { parseTranslationsConfig, type CustomTranslations } from '@/lib/translations-config'
import type { AppearanceConfigInput } from '@/lib/apply-appearance-config'
import type { AppearanceTheme } from '@/lib/appearance-presets'

export interface PublicSiteBootstrap {
  customTranslations: CustomTranslations
  analyticsConfig: AnalyticsConfig
  languages: SiteLanguage[]
  /** Full appearance row for fonts/effects — applied on every public page. */
  appearance: AppearanceConfigInput
}

function parseAppearanceBootstrap(raw: unknown): AppearanceConfigInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const obj = raw as Record<string, unknown>
  const theme =
    obj.theme && typeof obj.theme === 'object' && !Array.isArray(obj.theme)
      ? (obj.theme as AppearanceTheme)
      : undefined
  return {
    crtEnabled: typeof obj.crtEnabled === 'boolean' ? obj.crtEnabled : undefined,
    scanlineEnabled: typeof obj.scanlineEnabled === 'boolean' ? obj.scanlineEnabled : undefined,
    noiseEnabled: typeof obj.noiseEnabled === 'boolean' ? obj.noiseEnabled : undefined,
    noiseIntensity: typeof obj.noiseIntensity === 'number' ? obj.noiseIntensity : undefined,
    filmGrain: typeof obj.filmGrain === 'boolean' ? obj.filmGrain : undefined,
    accentColor: typeof obj.accentColor === 'string' ? obj.accentColor : undefined,
    accentColorSecondary: typeof obj.accentColorSecondary === 'string' ? obj.accentColorSecondary : undefined,
    vignetteOpacity: typeof obj.vignetteOpacity === 'number' ? obj.vignetteOpacity : undefined,
    chromaticStrength: typeof obj.chromaticStrength === 'number' ? obj.chromaticStrength : undefined,
    sectionPanelOpacity: typeof obj.sectionPanelOpacity === 'number' ? obj.sectionPanelOpacity : undefined,
    sectionGridOpacity: typeof obj.sectionGridOpacity === 'number' ? obj.sectionGridOpacity : undefined,
    cardSurfaceOpacity: typeof obj.cardSurfaceOpacity === 'number' ? obj.cardSurfaceOpacity : undefined,
    faviconUrl: typeof obj.faviconUrl === 'string' ? obj.faviconUrl : undefined,
    theme,
  }
}

export async function getPublicSiteBootstrap(): Promise<PublicSiteBootstrap> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_config')
      .select('key, value')
      .in('key', ['translations', 'analytics', 'languages', 'appearance'])

    const rows = (data ?? []) as Array<{ key: string; value: unknown }>
    const rowMap = Object.fromEntries(rows.map((row) => [row.key, row.value]))
    return {
      customTranslations: parseTranslationsConfig(rowMap.translations),
      analyticsConfig: parseAnalyticsConfig(rowMap.analytics),
      languages: parseLanguagesConfig(rowMap.languages),
      appearance: parseAppearanceBootstrap(rowMap.appearance),
    }
  } catch {
    return {
      customTranslations: {},
      analyticsConfig: parseAnalyticsConfig(null),
      languages: parseLanguagesConfig(null),
      appearance: {},
    }
  }
}