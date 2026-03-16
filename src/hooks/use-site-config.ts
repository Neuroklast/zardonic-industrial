import { useEffect, useRef } from 'react'
import { useKV } from './use-kv'
import { DEFAULT_SITE_CONFIG, createSiteConfig, migrateFromLegacyBandData } from '@/lib/site-config'
import type { SiteConfig } from '@/lib/types'

export interface UseSiteConfigReturn {
  config: SiteConfig
  setConfig: (config: SiteConfig) => void
  updateConfig: (partial: Partial<SiteConfig>) => void
  isLoaded: boolean
  isSetupComplete: boolean
}

export function useSiteConfig(): UseSiteConfigReturn {
  const [siteConfig, setSiteConfig, isLoaded] = useKV<SiteConfig>('site-config', DEFAULT_SITE_CONFIG)
  const [legacyBandData] = useKV<Record<string, unknown>>('band-data', {})
  const migrationDoneRef = useRef(false)

  useEffect(() => {
    if (!isLoaded) return
    if (migrationDoneRef.current) return
    migrationDoneRef.current = true

    const currentConfig = siteConfig
    const hasSiteConfig = currentConfig && currentConfig.siteId
    const hasLegacyData = legacyBandData && (legacyBandData as Record<string, unknown>).name

    if (!hasSiteConfig && hasLegacyData) {
      const migrated = migrateFromLegacyBandData(legacyBandData as Record<string, unknown>)
      setSiteConfig(migrated)
    }
  }, [isLoaded, siteConfig, legacyBandData, setSiteConfig])

  const config: SiteConfig = siteConfig
    ? { ...DEFAULT_SITE_CONFIG, ...siteConfig }
    : DEFAULT_SITE_CONFIG

  const setConfig = (newConfig: SiteConfig) => {
    setSiteConfig(createSiteConfig({ ...newConfig, updatedAt: new Date().toISOString() }))
  }

  const updateConfig = (partial: Partial<SiteConfig>) => {
    setSiteConfig((current) => {
      const base = current
        ? {
            ...DEFAULT_SITE_CONFIG,
            ...current,
            navigation: { ...DEFAULT_SITE_CONFIG.navigation, ...current.navigation },
            footer: { ...DEFAULT_SITE_CONFIG.footer, ...current.footer },
            seo: { ...DEFAULT_SITE_CONFIG.seo, ...current.seo },
            features: { ...DEFAULT_SITE_CONFIG.features, ...current.features },
          }
        : DEFAULT_SITE_CONFIG
      return {
        ...base,
        ...partial,
        updatedAt: new Date().toISOString(),
        navigation: partial.navigation
          ? { ...base.navigation, ...partial.navigation }
          : base.navigation,
        footer: partial.footer
          ? { ...base.footer, ...partial.footer }
          : base.footer,
        seo: partial.seo
          ? { ...base.seo, ...partial.seo }
          : base.seo,
        features: partial.features
          ? { ...base.features, ...partial.features }
          : base.features,
        themeSettings: partial.themeSettings
          ? { ...base.themeSettings, ...partial.themeSettings }
          : base.themeSettings,
        contactSettings: partial.contactSettings
          ? { ...base.contactSettings, ...partial.contactSettings }
          : base.contactSettings,
        newsletterSettings: partial.newsletterSettings
          ? { ...base.newsletterSettings, ...partial.newsletterSettings }
          : base.newsletterSettings,
      }
    })
  }

  return {
    config,
    setConfig,
    updateConfig,
    isLoaded,
    isSetupComplete: config.setupComplete,
  }
}
