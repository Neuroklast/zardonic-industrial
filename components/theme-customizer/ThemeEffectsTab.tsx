import { Eye, EyeSlash } from '@phosphor-icons/react'
import type { OverlayEffect, ThemeSettings } from '@/lib/types'
import { DEFAULT_OVERLAY, OVERLAY_LABELS } from '@/components/theme-customizer/theme-utils'
import { Label } from '@/components/ui/label'

interface ThemeEffectsTabProps {
  draft: ThemeSettings
  updateOverlayEffect: (key: string, updates: Partial<OverlayEffect>) => void
}

export function ThemeEffectsTab({ draft, updateOverlayEffect }: ThemeEffectsTabProps) {
  return (
    <div className="space-y-3">
      <p className="mb-3 font-mono text-xs text-muted-foreground/60">
        Enable, disable, and adjust visual overlay effects.
      </p>
      {Object.entries(OVERLAY_LABELS).map(([key, { name, description }]) => {
        const effect = draft.overlayEffects?.[key as keyof typeof draft.overlayEffects] || DEFAULT_OVERLAY
        return (
          <div key={key} className="space-y-2 border border-primary/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-mono text-xs text-foreground/90">{name}</span>
                <p className="font-mono text-xs text-muted-foreground/50">{description}</p>
              </div>
              <button
                onClick={() => updateOverlayEffect(key, { enabled: !effect.enabled })}
                className={`flex items-center gap-2 rounded px-3 py-1 text-xs font-mono transition-colors ${
                  effect.enabled ? 'bg-primary/10 text-primary' : 'bg-muted/20 text-muted-foreground/40'
                }`}
              >
                {effect.enabled ? <Eye size={14} /> : <EyeSlash size={14} />}
                {effect.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            {effect.enabled && (
              <div className="flex items-center gap-3">
                <Label className="w-16 flex-shrink-0 font-mono text-xs text-muted-foreground/60">Intensity</Label>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={effect.intensity}
                  onChange={e => updateOverlayEffect(key, { intensity: parseFloat(e.target.value) })}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded bg-primary/20 accent-primary"
                />
                <span className="w-8 text-right font-mono text-xs text-primary/70">{Math.round(effect.intensity * 100)}%</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
