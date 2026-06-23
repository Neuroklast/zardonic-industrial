'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { broadcastAdminDraft } from '@/lib/admin-draft-channel'
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
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const draftPayload = useMemo(
    () => ({
      headline,
      tagline,
      ctaLabel,
      ctaUrl,
      backgroundImageStoragePath: backgroundImageStoragePath || undefined,
      backgroundImageUrl: backgroundImageUrl || undefined,
      backgroundImageOpacity,
    }),
    [headline, tagline, ctaLabel, ctaUrl, backgroundImageStoragePath, backgroundImageUrl, backgroundImageOpacity],
  )

  useEffect(() => {
    broadcastAdminDraft('hero', draftPayload)
  }, [draftPayload])

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
      router.refresh()
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <div className="border border-zinc-800 rounded p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Hero Section</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Headline, tagline, CTA and optional hero-specific background image.</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">Headline</label>
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

        <div className="grid grid-cols-2 gap-3">
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
          label="Hero Background Image (optional)"
          currentUrl={backgroundImageUrl || null}
          storagePrefix="hero/background"
          onResolved={(path, publicUrl) => {
            setBackgroundImageStoragePath(path)
            if (publicUrl) setBackgroundImageUrl(publicUrl)
            setErrorMsg(null)
          }}
          onError={setErrorMsg}
        />
        <p className="text-xs text-zinc-500">Leave empty to use the global site background image.</p>

        <div className="space-y-2">
          <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">
            Background Image Opacity:{' '}
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