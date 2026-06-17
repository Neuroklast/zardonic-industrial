import type { Dispatch, SetStateAction } from 'react'
import { Label } from '@/components/ui/label'
import type { ThemeSettings } from '@/lib/types'
import { ColorInput } from '@/components/theme-customizer/theme-utils'

interface ThemeColorsTabProps {
  draft: ThemeSettings
  updateColor: (key: keyof ThemeSettings, value: string) => void
  setDraft: Dispatch<SetStateAction<ThemeSettings>>
}

export function ThemeColorsTab({ draft, updateColor, setDraft }: ThemeColorsTabProps) {
  return (
    <div className="space-y-2">
      <p className="mb-3 font-mono text-xs text-muted-foreground/60">
        Customize individual colors and border radius. Changes preview live.
      </p>
      <ColorInput label="Primary" value={draft.primary || 'oklch(0.50 0.22 25)'} onChange={value => updateColor('primary', value)} />
      <ColorInput label="Accent" value={draft.accent || 'oklch(0.60 0.24 25)'} onChange={value => updateColor('accent', value)} />
      <ColorInput label="Background" value={draft.background || 'oklch(0 0 0)'} onChange={value => updateColor('background', value)} />
      <ColorInput label="Card" value={draft.card || 'oklch(0.05 0 0)'} onChange={value => updateColor('card', value)} />
      <ColorInput label="Foreground" value={draft.foreground || 'oklch(1 0 0)'} onChange={value => updateColor('foreground', value)} />
      <ColorInput label="Muted Text" value={draft.mutedForeground || 'oklch(0.55 0 0)'} onChange={value => updateColor('mutedForeground', value)} />
      <ColorInput label="Border" value={draft.border || 'oklch(0.15 0 0)'} onChange={value => updateColor('border', value)} />
      <ColorInput label="Secondary" value={draft.secondary || 'oklch(0.10 0 0)'} onChange={value => updateColor('secondary', value)} />

      <div className="border-t border-primary/10 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <Label className="font-mono text-xs text-muted-foreground">Border Radius</Label>
          <span className="font-mono text-xs text-primary/70">{(draft.borderRadius ?? 0.125).toFixed(3)}rem</span>
        </div>
        <input
          type="range"
          min="0"
          max="1.5"
          step="0.025"
          value={draft.borderRadius ?? 0.125}
          onChange={e => setDraft(prev => ({ ...prev, borderRadius: parseFloat(e.target.value) }))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded bg-primary/20 accent-primary"
        />
        <div className="mt-1 flex justify-between font-mono text-xs text-muted-foreground/40">
          <span>SHARP</span>
          <span>ROUNDED</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-10 w-16 border border-primary/40 bg-primary/10" style={{ borderRadius: `${(draft.borderRadius ?? 0.125) * 16}px` }} />
          <div className="h-8 w-20 border border-primary/40 bg-primary/10" style={{ borderRadius: `${(draft.borderRadius ?? 0.125) * 16}px` }} />
          <span className="font-mono text-xs text-muted-foreground/50">Preview</span>
        </div>
      </div>
    </div>
  )
}
