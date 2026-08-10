'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { broadcastAdminDraft } from '@/lib/admin-draft-channel'
import { DEFAULT_HERO_LOGO_URL } from '@/lib/hero-defaults'
import { resolveImageUrl } from '@/lib/r2'
import * as SliderPrimitive from '@radix-ui/react-slider'

interface HeroConfigEditorProps {
  currentValue: Record<string, unknown>
}

export function HeroConfigEditor({ currentValue }: HeroConfigEditorProps) {
  const router = useRouter()
  const [headline, setHeadline] = useState(typeof currentValue.headline === 'string' ? currentValue.headline : 'ZARDONIC')
  const [tagline, setTagline] = useState(
    typeof currentValue.tagline === 'string' ? currentValue.tagline : 'Industrial Metal / Drum & Bass',
  )
  const [ctaLabel, setCtaLabel] = useState(typeof currentValue.ctaLabel === 'string' ? currentValue.ctaLabel : 'Listen Now')
  const [ctaUrl, setCtaUrl] = useState(typeof currentValue.ctaUrl === 'string' ? currentValue.ctaUrl : '#releases')
  const [logoImageStoragePath, setLogoImageStoragePath] = useState(
    typeof currentValue.logoImageStoragePath === 'string' ? currentValue.logoImageStoragePath : '',
  )
  const [logoImageUrl, setLogoImageUrl] = useState(
    resolveImageUrl(
      typeof currentValue.logoImageStoragePath === 'string' ? currentValue.logoImageStoragePath : null,
      typeof currentValue.logoImageUrl === 'string' ? currentValue.logoImageUrl : null,
    ) ?? '',
  )
  const [backgroundImageStoragePath, setBackgroundImageStoragePath] = useState(
    typeof currentValue.backgroundImageStoragePath === 'string' ? currentValue.backgroundImageStoragePath : '',
  )
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(
    resolveImageUrl(
      typeof currentValue.backgroundImageStoragePath === 'string' ? currentValue.backgroundImageStoragePath : null,
      typeof currentValue.backgroundImageUrl === 'string' ? currentValue.backgroundImageUrl : null,
    ) ?? '',
  )
  const [backgroundImageOpacity, setBackgroundImageOpacity] = useState<number>(
    typeof currentValue.backgroundImageOpacity === 'number' ? currentValue.backgroundImageOpacity : 0.35,
  )
  const [bootSequenceEnabled, setBootSequenceEnabled] = useState<boolean>(
    currentValue.bootSequenceEnabled === false ? false : true,
  )
  const clampW = (n: number) => Math.min(100, Math.max(15, Math.round(n)))
  /** Desktop wordmark width as % of content column (15–100). Height follows aspect ratio. */
  const [logoWidthPercent, setLogoWidthPercent] = useState<number>(() => {
    if (typeof currentValue.logoWidthPercent === 'number' && Number.isFinite(currentValue.logoWidthPercent)) {
      return clampW(currentValue.logoWidthPercent)
    }
    // Legacy height-rem → approximate width %
    if (typeof currentValue.logoMaxHeightRem === 'number' && Number.isFinite(currentValue.logoMaxHeightRem)) {
      return clampW((currentValue.logoMaxHeightRem / 48) * 100)
    }
    if (typeof currentValue.logoMaxHeight === 'string') {
      const m = currentValue.logoMaxHeight.match(/^([\d.]+)\s*rem$/i)
      if (m) return clampW((Number(m[1]) / 48) * 100)
    }
    return 55
  })
  /** Mobile wordmark width — separate because desktop % looks tiny on a phone column. */
  const [logoWidthPercentMobile, setLogoWidthPercentMobile] = useState<number>(() => {
    if (
      typeof currentValue.logoWidthPercentMobile === 'number' &&
      Number.isFinite(currentValue.logoWidthPercentMobile)
    ) {
      return clampW(currentValue.logoWidthPercentMobile)
    }
    // Sensible first paint: nearly full content width on phones (matches original wordmark feel).
    return 90
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const resolvedLogoPreview = logoImageUrl || DEFAULT_HERO_LOGO_URL

  const draftPayload = useMemo(
    () => ({
      headline,
      tagline,
      ctaLabel,
      ctaUrl,
      logoImageStoragePath: logoImageStoragePath || undefined,
      logoImageUrl: logoImageUrl || undefined,
      backgroundImageStoragePath: backgroundImageStoragePath || undefined,
      backgroundImageUrl: backgroundImageUrl || undefined,
      backgroundImageOpacity,
      bootSequenceEnabled,
      logoWidthPercent,
      logoWidthPercentMobile,
    }),
    [
      headline,
      tagline,
      ctaLabel,
      ctaUrl,
      logoImageStoragePath,
      logoImageUrl,
      backgroundImageStoragePath,
      backgroundImageUrl,
      backgroundImageOpacity,
      bootSequenceEnabled,
      logoWidthPercent,
      logoWidthPercentMobile,
    ],
  )

  useEffect(() => {
    broadcastAdminDraft('hero', {
      ...draftPayload,
      logoImageUrl: resolvedLogoPreview,
    })
  }, [draftPayload, resolvedLogoPreview])

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    const fd = new FormData()
    fd.set('key', 'hero')
    fd.set('value', JSON.stringify(draftPayload))
    const result = await updateSiteConfig(fd)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('saved')
      const { broadcastAdminRefresh } = await import('@/lib/admin-draft-channel')
      broadcastAdminRefresh()
      router.refresh()
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <div className="border border-zinc-800 rounded p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Hero Section</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Wordmark image, tagline, CTAs and optional hero-only background overlay.
        </p>
      </div>

      <div className="space-y-3">
        <MediaSourcePicker
          label="Hero Wordmark Image"
          currentUrl={logoImageUrl || DEFAULT_HERO_LOGO_URL}
          storagePrefix="hero/logo"
          editorFitMode="contain"
          maxOutputDimension={4096}
          onResolved={(path, publicUrl) => {
            setLogoImageStoragePath(path)
            if (publicUrl) setLogoImageUrl(publicUrl)
            setErrorMsg(null)
          }}
          onError={setErrorMsg}
        />
        <p className="text-xs text-zinc-500">
          PNG or WebP with transparency works best. Upload a large source (ideally ≥2000px wide) for sharp
          display at high width %. Exports keep up to 4096px. If the logo looks pixelated, re-upload after a
          crop-export fix so the file is full resolution (not the editor preview size). Leave empty for the
          default Zardonic wordmark.
        </p>
        {logoImageUrl ? (
          <button
            type="button"
            onClick={() => {
              setLogoImageStoragePath('')
              setLogoImageUrl('')
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Reset to default wordmark
          </button>
        ) : null}

        <div className="space-y-4 pt-1">
          <p className="text-xs text-zinc-500">
            Width as % of the content column (page margins only). Height scales with the image aspect
            ratio — no max-height. Desktop and mobile are separate: one value cannot look right on both.
          </p>

          <div className="space-y-2">
            <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">
              Desktop width:{' '}
              <span className="text-zinc-300 font-mono">{logoWidthPercent}%</span>
              <span className="text-zinc-600 font-normal normal-case tracking-normal ml-1">
                (md and up)
              </span>
            </label>
            <SliderPrimitive.Root
              min={15}
              max={100}
              step={1}
              value={[logoWidthPercent]}
              onValueChange={([v]) => setLogoWidthPercent(v)}
              className="relative flex items-center w-full touch-none select-none h-5"
              aria-label="Hero wordmark desktop width percent"
            >
              <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-zinc-700">
                <SliderPrimitive.Range className="absolute h-full rounded-full bg-red-500" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb className="block size-4 rounded-full border border-red-500 bg-zinc-900 shadow focus:outline-none cursor-grab" />
            </SliderPrimitive.Root>
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">
              Mobile width:{' '}
              <span className="text-zinc-300 font-mono">{logoWidthPercentMobile}%</span>
              <span className="text-zinc-600 font-normal normal-case tracking-normal ml-1">
                (phones)
              </span>
            </label>
            <SliderPrimitive.Root
              min={15}
              max={100}
              step={1}
              value={[logoWidthPercentMobile]}
              onValueChange={([v]) => setLogoWidthPercentMobile(v)}
              className="relative flex items-center w-full touch-none select-none h-5"
              aria-label="Hero wordmark mobile width percent"
            >
              <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-zinc-700">
                <SliderPrimitive.Range className="absolute h-full rounded-full bg-red-500" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb className="block size-4 rounded-full border border-red-500 bg-zinc-900 shadow focus:outline-none cursor-grab" />
            </SliderPrimitive.Root>
            <p className="text-xs text-zinc-500">
              Phones are a narrow column — 85–100% usually matches the old full-width wordmark feel.
              Desktop can stay lower (e.g. 55–70%) without shrinking mobile.
            </p>
          </div>

          {/* Live previews: desktop + mobile % of their preview rails */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Desktop preview</p>
              <div className="flex justify-center rounded border border-zinc-800 bg-zinc-950/80 p-4">
                <div className="flex w-full items-center justify-center">
                  <img
                    src={resolvedLogoPreview}
                    alt=""
                    className="h-auto object-contain brightness-110"
                    style={{ width: `${logoWidthPercent}%`, maxWidth: '100%' }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Mobile preview</p>
              <div className="mx-auto flex max-w-[14rem] justify-center rounded border border-zinc-800 bg-zinc-950/80 p-3">
                <div className="flex w-full items-center justify-center">
                  <img
                    src={resolvedLogoPreview}
                    alt=""
                    className="h-auto object-contain brightness-110"
                    style={{ width: `${logoWidthPercentMobile}%`, maxWidth: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">Alt text</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">CTA Label</label>
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-zinc-600"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">CTA URL</label>
            <input
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        <MediaSourcePicker
          label="Hero Background Overlay (optional)"
          currentUrl={backgroundImageUrl || null}
          storagePrefix="hero/background"
          editorAspectRatio={16 / 9}
          editorFitMode="cover"
          onResolved={(path, publicUrl) => {
            setBackgroundImageStoragePath(path)
            if (publicUrl) setBackgroundImageUrl(publicUrl)
            setErrorMsg(null)
          }}
          onError={setErrorMsg}
        />
        <p className="text-xs text-zinc-500">
          Full-bleed image behind the wordmark only — not the logo itself. Leave empty to use the global site background.
        </p>

        <div className="space-y-2">
          <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">
            Background Overlay Opacity:{' '}
            <span className="text-zinc-300 font-mono">{backgroundImageOpacity.toFixed(2)}</span>
          </label>
          <SliderPrimitive.Root
            min={0}
            max={1}
            step={0.05}
            value={[backgroundImageOpacity]}
            onValueChange={([v]) => setBackgroundImageOpacity(v)}
            className="relative flex items-center w-full touch-none select-none h-5"
          >
            <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-zinc-700">
              <SliderPrimitive.Range className="absolute h-full rounded-full bg-red-500" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block size-4 rounded-full border border-red-500 bg-zinc-900 shadow focus:outline-none cursor-grab" />
          </SliderPrimitive.Root>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 pt-2 border-t border-zinc-800">
          <div>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Wordmark boot sequence</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Short filmic entrance (~1.2s): scan reveal, RGB fringe, mini load bar and micro terminal lines. Off =
              logo shows immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBootSequenceEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              bootSequenceEnabled ? 'bg-red-600' : 'bg-zinc-700'
            }`}
            role="switch"
            aria-checked={bootSequenceEnabled}
            aria-label="Enable wordmark boot sequence"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                bootSequenceEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <p className="text-xs font-mono text-zinc-400">
          Boot sequence: {bootSequenceEnabled ? 'ON' : 'OFF'}
        </p>
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