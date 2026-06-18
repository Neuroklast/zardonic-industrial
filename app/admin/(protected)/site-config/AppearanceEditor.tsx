'use client'

import { useState } from 'react'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
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
}

const DEFAULTS: AppearanceConfig = {
  crtEnabled: true,
  scanlineEnabled: true,
  noiseEnabled: true,
  accentColor: '#dc2626',
  accentColorSecondary: '#7c3aed',
  vignetteOpacity: 0.3,
  chromaticStrength: 0.5,
}

function parseConfig(raw: Record<string, unknown>): AppearanceConfig {
  return {
    crtEnabled: typeof raw.crtEnabled === 'boolean' ? raw.crtEnabled : DEFAULTS.crtEnabled,
    scanlineEnabled: typeof raw.scanlineEnabled === 'boolean' ? raw.scanlineEnabled : DEFAULTS.scanlineEnabled,
    noiseEnabled: typeof raw.noiseEnabled === 'boolean' ? raw.noiseEnabled : DEFAULTS.noiseEnabled,
    accentColor: typeof raw.accentColor === 'string' ? raw.accentColor : DEFAULTS.accentColor,
    accentColorSecondary: typeof raw.accentColorSecondary === 'string' ? raw.accentColorSecondary : DEFAULTS.accentColorSecondary,
    vignetteOpacity: typeof raw.vignetteOpacity === 'number' ? raw.vignetteOpacity : DEFAULTS.vignetteOpacity,
    chromaticStrength: typeof raw.chromaticStrength === 'number' ? raw.chromaticStrength : DEFAULTS.chromaticStrength,
  }
}

interface AppearanceEditorProps {
  currentValue: Record<string, unknown>
}

export function AppearanceEditor({ currentValue }: AppearanceEditorProps) {
  const init = parseConfig(currentValue)
  const [crtEnabled, setCrtEnabled] = useState(init.crtEnabled)
  const [scanlineEnabled, setScanlineEnabled] = useState(init.scanlineEnabled)
  const [noiseEnabled, setNoiseEnabled] = useState(init.noiseEnabled)
  const [accentColor, setAccentColor] = useState(init.accentColor)
  const [accentColorSecondary, setAccentColorSecondary] = useState(init.accentColorSecondary)
  const [vignetteOpacity, setVignetteOpacity] = useState(init.vignetteOpacity)
  const [chromaticStrength, setChromaticStrength] = useState(init.chromaticStrength)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    const payload: AppearanceConfig = {
      crtEnabled, scanlineEnabled, noiseEnabled,
      accentColor, accentColorSecondary,
      vignetteOpacity, chromaticStrength,
    }
    const fd = new FormData()
    fd.set('key', 'appearance')
    fd.set('value', JSON.stringify(payload))
    const result = await updateSiteConfig(fd)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <div className="border border-zinc-800 rounded p-4 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Appearance &amp; Visual Effects</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Control CRT effects, accent colors, and post-processing intensity.</p>
      </div>

      {/* Effect toggles */}
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
              className="relative inline-flex h-5 w-9 items-center rounded-full border border-zinc-600 transition-colors data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-zinc-700 focus:outline-none"
            >
              <SwitchPrimitive.Thumb className="pointer-events-none block size-3.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
            </SwitchPrimitive.Root>
          </div>
        ))}
      </div>

      {/* Color pickers */}
      <div className="space-y-3">
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Accent Colors</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Primary Accent</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
                aria-label="Primary accent color"
              />
              <span className="font-mono text-xs text-zinc-400">{accentColor}</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Secondary Accent</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColorSecondary}
                onChange={(e) => setAccentColorSecondary(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
                aria-label="Secondary accent color"
              />
              <span className="font-mono text-xs text-zinc-400">{accentColorSecondary}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Intensity</p>

        <div className="space-y-2">
          <label className="block text-xs text-zinc-400">
            Vignette Opacity:{' '}
            <span className="font-mono text-zinc-300">{vignetteOpacity.toFixed(2)}</span>
          </label>
          <SliderPrimitive.Root
            min={0} max={1} step={0.05}
            value={[vignetteOpacity]}
            onValueChange={([v]) => setVignetteOpacity(v)}
            className="relative flex items-center w-full touch-none select-none h-5"
          >
            <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-zinc-700">
              <SliderPrimitive.Range className="absolute h-full rounded-full bg-red-500" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block size-4 rounded-full border border-red-500 bg-zinc-900 shadow focus:outline-none cursor-grab" />
          </SliderPrimitive.Root>
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-zinc-400">
            Chromatic Aberration Strength:{' '}
            <span className="font-mono text-zinc-300">{chromaticStrength.toFixed(2)}</span>
          </label>
          <SliderPrimitive.Root
            min={0} max={1} step={0.05}
            value={[chromaticStrength]}
            onValueChange={([v]) => setChromaticStrength(v)}
            className="relative flex items-center w-full touch-none select-none h-5"
          >
            <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-zinc-700">
              <SliderPrimitive.Range className="absolute h-full rounded-full bg-red-500" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block size-4 rounded-full border border-red-500 bg-zinc-900 shadow focus:outline-none cursor-grab" />
          </SliderPrimitive.Root>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && <span className="text-xs text-green-400">Saved</span>}
        {status === 'error' && <span className="text-xs text-red-400">{errorMsg ?? 'Error'}</span>}
      </div>
    </div>
  )
}
