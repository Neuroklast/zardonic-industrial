import type { ThemeSettings } from '@/lib/types'
import { THEME_PRESETS, type ThemePreset } from '@/components/theme-customizer/theme-utils'

interface ThemePresetsTabProps {
  draft: ThemeSettings
  onPresetSelect: (preset: ThemePreset) => void
}

export function ThemePresetsTab({ draft, onPresetSelect }: ThemePresetsTabProps) {
  return (
    <div className="space-y-3">
      <p className="mb-4 font-mono text-xs text-muted-foreground/60">
        Select a cyberpunk design preset. You can further customize colors and fonts in the other tabs.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {THEME_PRESETS.map(preset => (
          <button
            key={preset.name}
            onClick={() => onPresetSelect(preset)}
            className={`rounded border p-3 text-left transition-all hover:border-primary/50 ${
              draft.activePreset === preset.name ? 'border-primary bg-primary/10' : 'border-primary/15'
            }`}
          >
            <div className="mb-1 flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border border-white/20" style={{ background: preset.theme.primary }} />
              <div className="h-4 w-4 rounded-full border border-white/20" style={{ background: preset.theme.accent }} />
              <div className="h-4 w-4 rounded-full border border-white/20" style={{ background: preset.theme.background }} />
            </div>
            <div className="font-mono text-xs text-primary/90">{preset.name}</div>
            <div className="font-mono text-xs text-muted-foreground/60">{preset.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
