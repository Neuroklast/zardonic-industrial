'use client'

import { useEffect } from 'react'
import { applyAppearanceConfig, type AppearanceConfigInput } from '@/lib/apply-appearance-config'
import { ensureRemoteFontsLoaded, resolvePublicFonts } from '@/lib/public-fonts'

interface AppearanceBridgeProps {
  config: AppearanceConfigInput
}

/** Applies Appearance (including fonts) on every public route — never hardcode faces. */
export function AppearanceBridge({ config }: AppearanceBridgeProps) {
  useEffect(() => {
    applyAppearanceConfig(config)
    ensureRemoteFontsLoaded(resolvePublicFonts(config.theme))
  }, [config])

  return null
}