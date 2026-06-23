'use client'

import { useEffect } from 'react'
import { applyAppearanceConfig, type AppearanceConfigInput } from '@/lib/apply-appearance-config'

interface AppearanceBridgeProps {
  config: AppearanceConfigInput
}

export function AppearanceBridge({ config }: AppearanceBridgeProps) {
  useEffect(() => {
    applyAppearanceConfig(config)
  }, [config])

  return null
}