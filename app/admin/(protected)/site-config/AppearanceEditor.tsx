'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { resolveImageUrl } from '@/lib/r2'
import { broadcastAdminDraft } from '@/lib/admin-draft-channel'
import {
  BUILTIN_APPEARANCE_PRESETS,
  BODY_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  MONO_FONT_OPTIONS,
  type AppearanceTheme,
  type SavedAppearancePreset,
} from '@/lib/appearance-presets'
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
  faviconUrl?: string
  faviconStoragePath?: string
  theme?: AppearanceTheme
  savedPresets?: SavedAppearancePreset[]
}

const DEFAULT_THEME: AppearanceTheme = BUILTIN_APPEARANCE_PRESETS[0].theme

const THEME_COLOR_FIELDS: Array<{ key: keyof AppearanceTheme; label: string }> = [
  { key: 'primaryColor', label: 'Primary' },
  { key: 'accentColor', label: 'Accent' },
  { key: 'backgroundColor', label: 'Background' },
  { key: 'cardColor', label: 'Card' },
  { key: 'foregroundColor', label: 'Foreground' },
  { key: 'borderColor', label: 'Border' },
]

const DEFAULTS: AppearanceConfig = {
  crtEnabled: true,
  scanlineEnabled: true,
  noiseEnabled: true,
  accentColor: '#dc2626',
  accentColorSecondary: '#7c3aed',
  vignetteOpacity: 0.3,
  chromaticStrength: 0.5,
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
    faviconUrl: typeof raw.faviconUrl === 'string' ? raw.faviconUrl : DEFAULTS.faviconUrl,
    faviconStoragePath:
      typeof raw.faviconStoragePath === 'string' ? raw.faviconStoragePath : undefined,
    theme: parseTheme(raw.theme),
    savedPresets,
  }
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
  const [accentColorSecondary, setAccentColorSecondary] = useState(init.accentColorSecondary)
  const [vignetteOpacity, setVignetteOpacity] = useState(init.vignetteOpacity)
  const [chromaticStrength, setChromaticStrength] = useState(init.chromaticStrength)
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

  function updateThemeField(key: keyof AppearanceTheme, value: string) {
    setTheme((prev) => ({ ...prev, [key]: value }))
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
    <div className="border border-zinc-800 rounded p-4 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Appearance &amp; Theme</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Presets, colors, fonts and visual effects. Changes preview live before Save.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Built-in Presets</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {BUILTIN_APPEARANCE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-left px-3 py-2 rounded border border-zinc-800 hover:border-zinc-600 bg-zinc-950/50 transition-colors"
            >
              <span className="block text-xs text-zinc-200">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Your Presets</p>
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
          {savedPresets.length === 0 && (
            <span className="text-xs text-zinc-500">No saved presets yet.</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name"
            className="flex-1 font-mono text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300"
          />
          <button
            type="button"
            onClick={saveCustomPreset}
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            Save current
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Theme Colors</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {THEME_COLOR_FIELDS.map(({ key, label }) => {
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
                  <span className="font-mono text-xs text-zinc-500 truncate">{value}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Heading Font', key: 'fontHeading' as const, options: HEADING_FONT_OPTIONS },
          { label: 'Body Font', key: 'fontBody' as const, options: BODY_FONT_OPTIONS },
          { label: 'Mono Font', key: 'fontMono' as const, options: MONO_FONT_OPTIONS },
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

      <MediaSourcePicker
        label="Favicon"
        currentUrl={faviconUrl || null}
        storagePrefix="site/favicon"
        accept=".ico,.png,.svg,image/x-icon,image/png,image/svg+xml"
        onResolved={(path, publicUrl) => {
          setFaviconStoragePath(path)
          if (publicUrl) setFaviconUrl(publicUrl)
          setErrorMsg(null)
        }}
        onError={setErrorMsg}
      />

      <div className="space-y-3">
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Visual Effects</p>
        {[
          { label: 'CRT Overlay & Vignette', checked: crtEnabled, onChange: setCrtEnabled },
          { label: 'CRT Scanlines', checked: scanlineEnabled, onChange: setScanlineEnabled },
          { label: 'Noise / Glitch Effect', checked: noiseEnabled, onChange: setNoiseEnabled },
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">Legacy Accent (hex)</label>
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-zinc-700 bg-transparent"
            aria-label="Primary accent color"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">Secondary Accent (hex)</label>
          <input
            type="color"
            value={accentColorSecondary}
            onChange={(e) => setAccentColorSecondary(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-zinc-700 bg-transparent"
            aria-label="Secondary accent color"
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Intensity</p>
        {[
          { label: 'Vignette Opacity', value: vignetteOpacity, onChange: setVignetteOpacity },
          { label: 'Chromatic Aberration', value: chromaticStrength, onChange: setChromaticStrength },
        ].map(({ label, value, onChange }) => (
          <div key={label} className="space-y-2">
            <label className="block text-xs text-zinc-400">
              {label}: <span className="font-mono text-zinc-300">{value.toFixed(2)}</span>
            </label>
            <SliderPrimitive.Root
              min={0}
              max={1}
              step={0.05}
              value={[value]}
              onValueChange={([v]) => onChange(v)}
              className="relative flex items-center w-full h-5"
            >
              <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-zinc-700">
                <SliderPrimitive.Range className="absolute h-full rounded-full bg-red-500" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb className="block size-4 rounded-full border border-red-500 bg-zinc-900" />
            </SliderPrimitive.Root>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && <span className="text-xs text-green-400">Saved</span>}
        {status === 'error' && <span className="text-xs text-red-400">{errorMsg ?? 'Error'}</span>}
      </div>
    </div>
  )
}