import type { Dispatch, SetStateAction } from 'react'
import { Label } from '@/components/ui/label'
import { loadGoogleFont } from '@/lib/font-loader'
import type { ThemeSettings } from '@/lib/types'
import { FONT_OPTIONS } from '@/components/theme-customizer/theme-utils'

interface ThemeFontsTabProps {
  draft: ThemeSettings
  setDraft: Dispatch<SetStateAction<ThemeSettings>>
}

export function ThemeFontsTab({ draft, setDraft }: ThemeFontsTabProps) {
  return (
    <div className="space-y-4">
      <p className="mb-3 font-mono text-xs text-muted-foreground/60">
        Choose from local and Google Fonts. Font previews are shown below each selector.
      </p>
      {[
        { key: 'fontHeading' as const, label: 'Heading Font' },
        { key: 'fontBody' as const, label: 'Body Font' },
        { key: 'fontMono' as const, label: 'Mono/Code Font' },
      ].map(({ key, label }) => (
        <div key={key} className="space-y-1">
          <Label className="font-mono text-xs text-muted-foreground">{label}</Label>
          <select
            value={draft[key] || FONT_OPTIONS[0].value}
            onChange={e => {
              const option = FONT_OPTIONS.find(font => font.value === e.target.value)
              if (option?.google) loadGoogleFont(option.label)
              setDraft(prev => ({ ...prev, [key]: e.target.value }))
            }}
            className="h-9 w-full rounded border border-primary/20 bg-card px-3 text-xs text-foreground"
            style={{ fontFamily: draft[key] || FONT_OPTIONS[0].value }}
          >
            {FONT_OPTIONS.map(option => (
              <option key={option.value} value={option.value} style={{ fontFamily: option.value }}>
                {option.label}{option.google ? ' (Google)' : ''}
              </option>
            ))}
          </select>
          <div className="mt-1 border border-primary/10 bg-black/30 p-3" style={{ fontFamily: draft[key] || FONT_OPTIONS[0].value }}>
            <p className="text-sm text-foreground/80">
              NEUROKLAST — The quick brown fox jumps over the lazy dog
            </p>
            <p className="mt-1 text-xs text-foreground/50">
              0123456789 !@#$%^&amp;*() ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </p>
          </div>
        </div>
      ))}
      <div className="border-t border-primary/10 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <Label className="font-mono text-xs text-muted-foreground">Schriftgröße (Basis)</Label>
          <span className="font-mono text-xs text-primary/70">{Math.round((draft.fontSize ?? 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.75"
          max="1.5"
          step="0.05"
          value={draft.fontSize ?? 1}
          onChange={e => setDraft(prev => ({ ...prev, fontSize: parseFloat(e.target.value) }))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded bg-primary/20 accent-primary"
          aria-label="Schriftgröße"
        />
        <div className="mt-1 flex justify-between font-mono text-xs text-muted-foreground/40">
          <span>KLEIN (75%)</span>
          <span>NORMAL (100%)</span>
          <span>GROß (150%)</span>
        </div>
      </div>
    </div>
  )
}
