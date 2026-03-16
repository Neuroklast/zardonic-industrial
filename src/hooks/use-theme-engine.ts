import { createContext, useContext } from 'react'
import type { ThemeSettings } from '@/lib/types'

export interface ThemeContextValue {
  themeSettings: ThemeSettings | undefined
  setThemeSettings: (settings: ThemeSettings) => void
  activePreset: string | undefined
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useThemeEngine = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useThemeEngine must be used within a ThemeProvider')
  }
  return ctx
}
