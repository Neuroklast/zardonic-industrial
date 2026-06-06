import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, MutableRefObject } from 'react'
import { ArrowCounterClockwise, ArrowSquareIn, Export, FloppyDisk, X } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { OverlayEffect, ThemeSettings } from '@/lib/types'
import {
  DEFAULT_OVERLAY,
  THEME_PRESETS,
  applyThemeToDOM,
  loadAllGoogleFonts,
  resetThemeDOM,
  type ThemePreset,
} from '@/components/theme-customizer/theme-utils'

const ThemePresetsTab = lazy(() => import('@/components/theme-customizer/ThemePresetsTab').then(m => ({ default: m.ThemePresetsTab })))
const ThemeColorsTab = lazy(() => import('@/components/theme-customizer/ThemeColorsTab').then(m => ({ default: m.ThemeColorsTab })))
const ThemeFontsTab = lazy(() => import('@/components/theme-customizer/ThemeFontsTab').then(m => ({ default: m.ThemeFontsTab })))
const ThemeEffectsTab = lazy(() => import('@/components/theme-customizer/ThemeEffectsTab').then(m => ({ default: m.ThemeEffectsTab })))
const ThemeVisibilityTab = lazy(() => import('@/components/theme-customizer/ThemeVisibilityTab').then(m => ({ default: m.ThemeVisibilityTab })))

type ThemeCustomizerTab = 'colors' | 'fonts' | 'presets' | 'visibility' | 'effects'

interface ThemeCustomizerDialogProps {
  open: boolean
  onClose: () => void
  themeSettings: ThemeSettings | undefined
  onSaveTheme: (theme: ThemeSettings) => void
  sectionVisibility: Record<string, boolean> | undefined
  onSaveSectionVisibility: (vis: Record<string, boolean>) => void
}

interface ThemeCustomizerDialogContentProps {
  onClose: () => void
  themeSettings: ThemeSettings | undefined
  onSaveTheme: (theme: ThemeSettings) => void
  sectionVisibility: Record<string, boolean> | undefined
  onSaveSectionVisibility: (vis: Record<string, boolean>) => void
  fileInputRef: MutableRefObject<HTMLInputElement | null>
}

function ThemeCustomizerDialogContent({ onClose, themeSettings, onSaveTheme, sectionVisibility, onSaveSectionVisibility, fileInputRef }: ThemeCustomizerDialogContentProps) {
  const [draft, setDraft] = useState<ThemeSettings>(themeSettings || {})
  const [visDraft, setVisDraft] = useState<Record<string, boolean>>(sectionVisibility || {})
  const [activeTab, setActiveTab] = useState<ThemeCustomizerTab>('presets')
  const undoStack = useRef<ThemeSettings[]>([])
  const [canUndo, setCanUndo] = useState(false)

  const pushUndo = useCallback((prev: ThemeSettings) => {
    undoStack.current = [...undoStack.current.slice(-19), prev]
    setCanUndo(true)
  }, [])

  const handleUndo = useCallback(() => {
    const prev = undoStack.current.pop()
    if (prev) {
      setDraft(prev)
      applyThemeToDOM(prev)
      setCanUndo(undoStack.current.length > 0)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'fonts') loadAllGoogleFonts()
  }, [activeTab])

  useEffect(() => {
    applyThemeToDOM(draft)
  }, [draft])

  const updateColor = useCallback((key: keyof ThemeSettings, value: string) => {
    setDraft(prev => {
      pushUndo(prev)
      return { ...prev, [key]: value }
    })
  }, [pushUndo])

  const handlePreset = useCallback((preset: ThemePreset) => {
    pushUndo(draft)
    setDraft({ ...preset.theme, activePreset: preset.name })
  }, [draft, pushUndo])

  const handleSave = useCallback(() => {
    onSaveTheme(draft)
    onSaveSectionVisibility(visDraft)
    toast.success('Theme saved')
    onClose()
  }, [draft, onClose, onSaveSectionVisibility, onSaveTheme, visDraft])

  const handleReset = useCallback(() => {
    pushUndo(draft)
    const defaults = THEME_PRESETS[0].theme
    setDraft({ ...defaults, activePreset: THEME_PRESETS[0].name })
    resetThemeDOM()
    applyThemeToDOM(defaults)
  }, [draft, pushUndo])

  const handleExportTheme = useCallback(() => {
    const json = JSON.stringify({ theme: draft, visibility: visDraft }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `theme-${(draft.activePreset || 'custom').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    toast.success('Theme exported')
  }, [draft, visDraft])

  const handleImportTheme = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        if (parsed.theme) {
          setDraft(parsed.theme)
          if (parsed.visibility) setVisDraft(parsed.visibility)
          toast.success('Theme imported')
        } else {
          toast.error('Invalid theme file')
        }
      } catch {
        toast.error('Failed to parse theme file')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }, [])

  const toggleVisibility = useCallback((key: string) => {
    setVisDraft(prev => {
      const currentlyVisible = prev[key] !== false
      return { ...prev, [key]: !currentlyVisible }
    })
  }, [])

  const updateOverlayEffect = useCallback((key: string, updates: Partial<OverlayEffect>) => {
    setDraft(prev => ({
      ...prev,
      overlayEffects: {
        ...prev.overlayEffects,
        [key]: {
          ...(prev.overlayEffects?.[key as keyof NonNullable<ThemeSettings['overlayEffects']>] || DEFAULT_OVERLAY),
          ...updates,
        },
      },
    }))
  }, [])

  const tabs = [
    { key: 'presets' as const, label: 'PRESETS' },
    { key: 'colors' as const, label: 'COLORS' },
    { key: 'fonts' as const, label: 'FONTS' },
    { key: 'effects' as const, label: 'EFFECTS' },
    { key: 'visibility' as const, label: 'VISIBILITY' },
  ]

  const renderTab = () => {
    switch (activeTab) {
      case 'presets':
        return <ThemePresetsTab draft={draft} onPresetSelect={handlePreset} />
      case 'colors':
        return <ThemeColorsTab draft={draft} updateColor={updateColor} setDraft={setDraft} />
      case 'fonts':
        return <ThemeFontsTab draft={draft} setDraft={setDraft} />
      case 'effects':
        return <ThemeEffectsTab draft={draft} updateOverlayEffect={updateOverlayEffect} />
      case 'visibility':
        return <ThemeVisibilityTab visDraft={visDraft} toggleVisibility={toggleVisibility} />
    }
  }

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur-sm"
      style={{ zIndex: 'var(--z-overlay)' } as CSSProperties}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-3xl overflow-hidden border-2 border-primary/30 bg-card"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={event => event.stopPropagation()}
      >
        <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-primary/50" />
        <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-primary/50" />
        <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-primary/50" />
        <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-primary/50" />

        <div className="flex h-12 items-center justify-between border-b border-primary/30 bg-primary/10 px-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="font-mono text-xs uppercase tracking-wider text-primary/70">THEME CUSTOMIZER</span>
            {draft.activePreset && (
              <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-xs text-primary">{draft.activePreset}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-primary/60 hover:text-primary" aria-label="Close theme customizer">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-primary/20">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 font-mono text-xs tracking-wider transition-colors ${activeTab === tab.key ? 'border-b-2 border-primary bg-primary/5 text-primary' : 'text-muted-foreground hover:text-primary/70'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          <Suspense fallback={null}>{renderTab()}</Suspense>
        </div>

        <input type="file" accept=".json,application/json" className="hidden" ref={fileInputRef} onChange={handleImportTheme} />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-primary/20 p-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportTheme} className="gap-1 border-primary/30 text-xs">
              <Export size={14} /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1 border-primary/30 text-xs">
              <ArrowSquareIn size={14} /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1 border-primary/30 text-xs">
              <ArrowCounterClockwise size={14} /> Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={!canUndo} className="gap-1 border-primary/30 text-xs disabled:opacity-40" title="Undo last change">
              <ArrowCounterClockwise size={14} /> Undo
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} className="gap-1">
              <FloppyDisk size={14} /> Save Theme
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ThemeCustomizerDialog(props: ThemeCustomizerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <AnimatePresence>
      {props.open && <ThemeCustomizerDialogContent {...props} fileInputRef={fileInputRef} />}
    </AnimatePresence>
  )
}
