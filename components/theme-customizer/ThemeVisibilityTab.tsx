import { Eye, EyeSlash } from '@phosphor-icons/react'
import { SECTION_LABELS } from '@/components/theme-customizer/theme-utils'

interface ThemeVisibilityTabProps {
  visDraft: Record<string, boolean>
  toggleVisibility: (key: string) => void
}

export function ThemeVisibilityTab({ visDraft, toggleVisibility }: ThemeVisibilityTabProps) {
  return (
    <div className="space-y-2">
      <p className="mb-3 font-mono text-xs text-muted-foreground/60">
        Show or hide individual sections and effects.
      </p>
      {(Object.keys(SECTION_LABELS) as string[]).map(key => {
        const visible = visDraft[key] !== false
        return (
          <div key={key} className="flex items-center justify-between border-b border-primary/5 py-2">
            <span className="font-mono text-xs text-muted-foreground">{SECTION_LABELS[key]}</span>
            <button
              onClick={() => toggleVisibility(key)}
              className={`flex items-center gap-2 rounded px-3 py-1 text-xs font-mono transition-colors ${
                visible ? 'bg-primary/10 text-primary' : 'bg-muted/20 text-muted-foreground/40'
              }`}
            >
              {visible ? <Eye size={14} /> : <EyeSlash size={14} />}
              {visible ? 'VISIBLE' : 'HIDDEN'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
