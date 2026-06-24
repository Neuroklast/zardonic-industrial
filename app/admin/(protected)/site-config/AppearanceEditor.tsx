'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { AdminAccordion } from '@/app/admin/_components/AdminAccordion'
import { resolveImageUrl } from '@/lib/r2'
import { broadcastAdminDraft } from '@/lib/admin-draft-channel'
import {
  BUILTIN_APPEARANCE_PRESETS,
  BODY_FONT_OPTIONS,
  FONT_SIZE_RANGES,
  formatFontSizeRem,
  HEADING_FONT_OPTIONS,
  MONO_FONT_OPTIONS,
  parseFontSizeRem,
  type AppearanceTheme,
  type SavedAppearancePreset,
} from '@/lib/appearance-presets'
import {
  DEFAULT_CARD_SURFACE_OPACITY,
  DEFAULT_SECTION_PANEL_OPACITY,
} from '@/lib/apply-appearance-config'
import { hexToOklch, oklchToHex } from '@/lib/color-utils'
import * as SliderPrimitive from '@radix-ui/react-slider'
import * as SwitchPrimitive from '@radix-ui/react-switch'

export interface AppearanceConfig {
  crtEnabled: boolean
  scanlineEnabled: boolean
  noiseEnabled: boolean
  accentColor: string
  accentColorSecondary: string
  vignetteOpacity: number
  chromaticStrength: number
  sectionPanelOpacity: number
  sectionGridOpacity: number
  cardSurfaceOpacity: number
  faviconUrl?: string
  faviconStoragePath?: string
  theme?: AppearanceTheme
  savedPresets?: SavedAppearancePreset[]
}

const DEFAULT_THEME: AppearanceTheme = BUILTIN_APPEARANCE_PRESETS[0].theme

const THEME_COLOR_FIELDS: Array<{ key: keyof AppearanceTheme; label: string; hint: string }> = [
  { key: 'foregroundColor', label: 'Headings & primary text', hint: 'Section titles, card titles, links' },
  { key: 'mutedForegroundColor', label: 'Body & secondary text', hint: 'Paragraphs, dates, subtitles' },
  { key: 'backgroundColor', label: 'Page background', hint: 'Behind everything' },
  { key: 'cardColor', label: 'Panel color', hint: 'Base color for sections & cards' },
  { key: 'accentColor', label: 'Accent', hint: 'Highlights and glow' },
  { key: 'primaryColor', label: 'Links & buttons', hint: 'Interactive elements' },
  { key: 'borderColor', label: 'Borders', hint: 'Lines and dividers' },
]

const DEFAULTS: AppearanceConfig = {
  crtEnabled: true,
  scanlineEnabled: true,
  noiseEnabled: true,
  accentColor: '#dc2626',
  accentColorSecondary: '#7c3aed',
  vignetteOpacity: 0.3,
  chromaticStrength: 0.5,
  sectionPanelOpacity: DEFAULT_SECTION_PANEL_OPACITY,
  sectionGridOpacity: 0,
  cardSurfaceOpacity: DEFAULT_CARD_SURFACE_OPACITY,
  faviconUrl: '',
  theme: DEFAULT_THEME,
  savedPresets: [],
}

function parseTheme(raw: unknown): AppearanceTheme {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_THEME }
  const source = raw as Record<string, unknown>
  const theme: AppearanceTheme = { ...DEFAULT_THEME }
  for (const key of Object.keys(DEFAULT_THEME) as Array<keyof AppearanceTheme>) {
    if (typeof source[key] === 'string') theme[key] = source[key] as string
  }
  return theme
}

function parseConfig(raw: Record<string, unknown>): AppearanceConfig {
  const savedPresets = Array.isArray(raw.savedPresets)
    ? (raw.savedPresets as SavedAppearancePreset[]).filter(
        (p) => p && typeof p.name === 'string' && p.theme && typeof p.theme === 'object',
      )
    : []

  return {
    crtEnabled: typeof raw.crtEnabled === 'boolean' ? raw.crtEnabled : DEFAULTS.crtEnabled,
    scanlineEnabled: typeof raw.scanlineEnabled === 'boolean' ? raw.scanlineEnabled : DEFAULTS.scanlineEnabled,
    noiseEnabled: typeof raw.noiseEnabled === 'boolean' ? raw.noiseEnabled : DEFAULTS.noiseEnabled,
    accentColor: typeof raw.accentColor === 'string' ? raw.accentColor : DEFAULTS.accentColor,
    accentColorSecondary:
      typeof raw.accentColorSecondary === 'string' ? raw.accentColorSecondary : DEFAULTS.accentColorSecondary,
    vignetteOpacity: typeof raw.vignetteOpacity === 'number' ? raw.vignetteOpacity : DEFAULTS.vignetteOpacity,
    chromaticStrength:
      typeof raw.chromaticStrength === 'number' ? raw.chromaticStrength : DEFAULTS.chromaticStrength,
    sectionPanelOpacity:
      typeof raw.sectionPanelOpacity === 'number'
        ? raw.sectionPanelOpacity
        : DEFAULTS.sectionPanelOpacity,
    sectionGridOpacity:
      typeof raw.sectionGridOpacity === 'number'
        ? raw.sectionGridOpacity
        : DEFAULTS.sectionGridOpacity,
    cardSurfaceOpacity:
      typeof raw.cardSurfaceOpacity === 'number'
        ? raw.cardSurfaceOpacity
        : DEFAULTS.cardSurfaceOpacity,
    faviconUrl: typeof raw.faviconUrl === 'string' ? raw.faviconUrl : DEFAULTS.faviconUrl,
    faviconStoragePath:
      typeof raw.faviconStoragePath === 'string' ? raw.faviconStoragePath : undefined,
    theme: parseTheme(raw.theme),
    savedPresets,
  }
}

function PresetSwatch({ theme }: { theme: AppearanceTheme }) {
  const colors = [
    theme.backgroundColor,
    theme.cardColor,
    theme.accentColor,
  ].map((c) => (c ? oklchToHex(c) : '#000000'))

  return (
    <span className="flex gap-1 mt-1.5" aria-hidden="true">
      {colors.map((hex) => (
        <span
          key={hex}
          className="size-3 rounded-sm border border-zinc-700"
          style={{ backgroundColor: hex }}
        />
      ))}
    </span>
  )
}

function OpacitySlider({
  label,
  value,
  onChange,
  description,
  disabled = false,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  description: string
  disabled?: boolean
}) {
  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
      <label className="block text-xs text-zinc-400">
        {label}: <span className="font-mono text-zinc-300">{Math.round(value * 100)}%</span>
      </label>
      <SliderPrimitive.Root
        min={0}
        max={1}
        step={0.05}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
        className="relative flex items-center w-full h-5"
        aria-label={label}
      >
        <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-zinc-700">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-red-500" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-4 rounded-full border border-red-500 bg-zinc-900" />
      </SliderPrimitive.Root>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  )
}

interface AppearanceEditorProps {
  currentValue: Record<string, unknown>
}

export function AppearanceEditor({ currentValue }: AppearanceEditorProps) {
  const router = useRouter()
  const init = useMemo(() => parseConfig(currentValue), [currentValue])

  const [crtEnabled, setCrtEnabled] = useState(init.crtEnabled)
  const [scanlineEnabled, setScanlineEnabled] = useState(init.scanlineEnabled)
  const [noiseEnabled, setNoiseEnabled] = useState(init.noiseEnabled)
  const [accentColor, setAccentColor] = useState(init.accentColor)
  const [accentColorSecondary] = useState(init.accentColorSecondary)
  const [vignetteOpacity, setVignetteOpacity] = useState(init.vignetteOpacity)
  const [chromaticStrength, setChromaticStrength] = useState(init.chromaticStrength)
  const [sectionPanelOpacity, setSectionPanelOpacity] = useState(init.sectionPanelOpacity)
  const [sectionGridOpacity, setSectionGridOpacity] = useState(init.sectionGridOpacity)
  const [cardSurfaceOpacity, setCardSurfaceOpacity] = useState(init.cardSurfaceOpacity)
  const [faviconStoragePath, setFaviconStoragePath] = useState(init.faviconStoragePath ?? '')
  const [faviconUrl, setFaviconUrl] = useState(
    resolveImageUrl(init.faviconStoragePath, init.faviconUrl) ?? '',
  )
  const [theme, setTheme] = useState<AppearanceTheme>(init.theme ?? DEFAULT_THEME)
  const [savedPresets, setSavedPresets] = useState<SavedAppearancePreset[]>(init.savedPresets ?? [])
  const [presetName, setPresetName] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const payload = useMemo<AppearanceConfig>(
    () => ({
      crtEnabled,
      scanlineEnabled,
      noiseEnabled,
      accentColor,
      accentColorSecondary,
      vignetteOpacity,
      chromaticStrength,
      sectionPanelOpacity,
      sectionGridOpacity,
      cardSurfaceOpacity,
      faviconUrl: faviconUrl || undefined,
      faviconStoragePath: faviconStoragePath || undefined,
      theme,
      savedPresets,
    }),
    [
      crtEnabled,
      scanlineEnabled,
      noiseEnabled,
      accentColor,
      accentColorSecondary,
      vignetteOpacity,
      chromaticStrength,
      sectionPanelOpacity,
      sectionGridOpacity,
      cardSurfaceOpacity,
      faviconUrl,
      faviconStoragePath,
      theme,
      savedPresets,
    ],
  )

  useEffect(() => {
    broadcastAdminDraft('appearance', payload as unknown as Record<string, unknown>)
  }, [payload])

  function applyPreset(preset: SavedAppearancePreset) {
    setTheme({ ...preset.theme })
    if (preset.theme.accentColor) setAccentColor(oklchToHex(preset.theme.accentColor))
  }

  function applyReadableMode() {
    setSectionPanelOpacity(0.7)
    setCardSurfaceOpacity(0.9)
  }

  function updateThemeField(key: keyof AppearanceTheme, value: string) {
    setTheme((prev) => ({ ...prev, [key]: value }))
    if (key === 'accentColor') setAccentColor(oklchToHex(value))
  }

  function saveCustomPreset() {
    const name = presetName.trim()
    if (!name) return
    const next = [...savedPresets.filter((p) => p.name !== name), { name, theme: { ...theme } }]
    setSavedPresets(next)
    setPresetName('')
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    const fd = new FormData()
    fd.set('key', 'appearance')
    fd.set('value', JSON.stringify(payload))
    const result = await updateSiteConfig(fd)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('saved')
      router.refresh()
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <div className="border border-zinc-800 rounded p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Theme</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Start with a preset, adjust surfaces, then fine-tune colors and effects. Preview updates live.
        </p>
      </div>

      <AdminAccordion
        title="Quick start"
        description="Presets and section backgrounds — most changes happen here"
        defaultOpen
      >
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Color themes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BUILTIN_APPEARANCE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-left px-3 py-2 rounded border border-zinc-800 hover:border-zinc-600 bg-zinc-950/50 transition-colors"
              >
                <span className="block text-xs text-zinc-200">{preset.name}</span>
                <PresetSwatch theme={preset.theme} />
              </button>
            ))}
          </div>
        </div>

        {savedPresets.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Your saved themes</p>
            <div className="flex flex-wrap gap-2">
              {savedPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2 py-1 text-xs rounded border border-zinc-700 text-zinc-300 hover:text-white"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Save current look as…"
            className="flex-1 font-mono text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300"
          />
          <button
            type="button"
            onClick={saveCustomPreset}
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            Save
          </button>
        </div>

        <div className="space-y-4 pt-2 border-t border-zinc-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Backgrounds</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-md">
                One place for section surfaces: frosted panel plus optional grid lines. Page background is set in the Background tab.
              </p>
            </div>
            <button
              type="button"
              onClick={applyReadableMode}
              className="px-3 py-1.5 text-xs rounded border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors shrink-0"
            >
              Readable defaults
            </button>
          </div>
          <OpacitySlider
            label="Section background"
            value={sectionPanelOpacity}
            onChange={(value) => {
              setSectionPanelOpacity(value)
              if (value === 0) setSectionGridOpacity(0)
            }}
            description="Frosted panel and border around each section. At 0%, panels and borders disappear."
          />
          <OpacitySlider
            label="Grid lines on sections"
            value={sectionGridOpacity}
            onChange={setSectionGridOpacity}
            description="Accent grid inside section panels. Set to 0% to hide."
            disabled={sectionPanelOpacity === 0}
          />
          <OpacitySlider
            label="Card background"
            value={cardSurfaceOpacity}
            onChange={setCardSurfaceOpacity}
            description="Individual items (releases, gigs, tiles). Keep above ~50% when sections are transparent."
          />
          {sectionPanelOpacity < 0.2 && (
            <p className="text-xs text-amber-500/90">
              Low section background makes text harder to read against animated backgrounds.
            </p>
          )}
        </div>
      </AdminAccordion>

      <AdminAccordion title="Colors & fonts" description="Fine-tune palette, typography and favicon">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEME_COLOR_FIELDS.map(({ key, label, hint }) => {
            const value = theme[key] ?? ''
            const hex = value ? oklchToHex(value) : '#000000'
            return (
              <div key={key} className="space-y-1">
                <label className="text-xs text-zinc-400">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) => updateThemeField(key, hexToOklch(e.target.value))}
                    className="h-8 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent"
                    aria-label={`${label} color`}
                  />
                  <span className="text-xs text-zinc-500">{hint}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-800">
          {[
            { label: 'Heading font', key: 'fontHeading' as const, options: HEADING_FONT_OPTIONS },
            { label: 'Body font', key: 'fontBody' as const, options: BODY_FONT_OPTIONS },
            { label: 'Mono font', key: 'fontMono' as const, options: MONO_FONT_OPTIONS },
          ].map(({ label, key, options }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-zinc-400">{label}</label>
              <select
                value={theme[key] ?? ''}
                onChange={(e) => updateThemeField(key, e.target.value)}
                className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-zinc-300"
              >
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-2 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            Section heading size only affects large section titles — not release cards, browse pages, or other item labels.
          </p>
          {(Object.keys(FONT_SIZE_RANGES) as Array<keyof typeof FONT_SIZE_RANGES>).map((key) => {
            const range = FONT_SIZE_RANGES[key]
            const current = parseFontSizeRem(theme[range.themeKey], range.default)
            return (
              <div key={key} className="space-y-2">
                <label className="block text-xs text-zinc-400">
                  {range.label}: <span className="font-mono text-zinc-300">{formatFontSizeRem(current)}</span>
                </label>
                <SliderPrimitive.Root
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={[current]}
                  onValueChange={([v]) => updateThemeField(range.themeKey, formatFontSizeRem(v))}
                  className="relative flex items-center w-full h-5"
                  aria-label={range.label}
                >
                  <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-zinc-700">
                    <SliderPrimitive.Range className="absolute h-full rounded-full bg-red-500" />
                  </SliderPrimitive.Track>
                  <SliderPrimitive.Thumb className="block size-4 rounded-full border border-red-500 bg-zinc-900" />
                </SliderPrimitive.Root>
              </div>
            )
          })}
        </div>

        <MediaSourcePicker
          label="Favicon"
          currentUrl={faviconUrl || null}
          storagePrefix="site/favicon"
          accept=".ico,.png,.svg,image/x-icon,image/png,image/svg+xml"
          editorAspectRatio={1}
          editorFitMode="contain"
          onResolved={(path, publicUrl) => {
            setFaviconStoragePath(path)
            if (publicUrl) setFaviconUrl(publicUrl)
            setErrorMsg(null)
          }}
          onError={setErrorMsg}
        />
      </AdminAccordion>

      <AdminAccordion title="Visual effects" description="CRT overlay, scanlines and intensity">
        {[
          { label: 'CRT overlay & vignette', checked: crtEnabled, onChange: setCrtEnabled },
          { label: 'Scanlines', checked: scanlineEnabled, onChange: setScanlineEnabled },
          { label: 'Noise / glitch', checked: noiseEnabled, onChange: setNoiseEnabled },
        ].map(({ label, checked, onChange }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-zinc-300">{label}</span>
            <SwitchPrimitive.Root
              checked={checked}
              onCheckedChange={onChange}
              className="relative inline-flex h-5 w-9 items-center rounded-full border border-zinc-600 transition-colors data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-zinc-700"
            >
              <SwitchPrimitive.Thumb className="pointer-events-none block size-3.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
            </SwitchPrimitive.Root>
          </div>
        ))}

        <div className="space-y-4 pt-2 border-t border-zinc-800">
          <OpacitySlider
            label="Vignette (dark edges)"
            value={vignetteOpacity}
            onChange={setVignetteOpacity}
            description="Darkening around the screen edges."
          />
          <OpacitySlider
            label="Chromatic aberration"
            value={chromaticStrength}
            onChange={setChromaticStrength}
            description="Color fringing on hover effects."
          />
        </div>
      </AdminAccordion>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save theme'}
        </button>
        {status === 'saved' && <span className="text-xs text-green-400">Saved</span>}
        {status === 'error' && <span className="text-xs text-red-400">{errorMsg ?? 'Error'}</span>}
      </div>
    </div>
  )
}