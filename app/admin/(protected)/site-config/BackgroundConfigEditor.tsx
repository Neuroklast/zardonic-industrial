'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import { createSignedUploadUrl } from '@/app/admin/_actions/r2Upload'
import * as SliderPrimitive from '@radix-ui/react-slider'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

const R2_BUCKET = process.env.NEXT_PUBLIC_R2_BUCKET_MEDIA ?? 'zardonic-media'

type BackgroundType = 'matrix' | 'circuit' | 'minimal'

interface BackgroundConfigEditorProps {
  currentValue: Record<string, unknown>
}

export function BackgroundConfigEditor({ currentValue }: BackgroundConfigEditorProps) {
  const [imageUrl, setImageUrl] = useState((currentValue.url as string) ?? '')
  const [videoUrl, setVideoUrl] = useState((currentValue.video_url as string) ?? '')
  const rawBgType = currentValue.backgroundType as string | undefined
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(
    rawBgType === 'circuit' || rawBgType === 'minimal' || rawBgType === 'matrix'
      ? rawBgType
      : 'matrix',
  )
  const [backgroundImageOpacity, setBackgroundImageOpacity] = useState<number>(
    typeof currentValue.backgroundImageOpacity === 'number' ? currentValue.backgroundImageOpacity : 0.6,
  )
  const [uploadingImage, setUploadingImage] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setErrorMsg(null)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `background/bg-${Date.now()}.${ext}`
      const { url, publicUrl } = await createSignedUploadUrl(R2_BUCKET, path)
      const res = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      if (!res.ok) throw new Error('Upload failed')
      setImageUrl(publicUrl)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    const value = JSON.stringify({
      url: imageUrl || undefined,
      video_url: videoUrl || undefined,
      backgroundType,
      backgroundImageOpacity,
    })
    const fd = new FormData()
    fd.set('key', 'background')
    fd.set('value', value)
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
    <div className="border border-zinc-800 rounded p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Background</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Upload or paste a URL for the background image. Optionally add a video URL for a
          looping video background (video takes precedence when set).
        </p>
      </div>

      {/* Background Type */}
      <div className="space-y-2">
        <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">
          Background Animation Type
        </label>
        <RadioGroupPrimitive.Root
          value={backgroundType}
          onValueChange={(v) => setBackgroundType(v as BackgroundType)}
          className="flex gap-4"
        >
          {(['matrix', 'circuit', 'minimal'] as const).map((type) => (
            <label key={type} className="flex items-center gap-1.5 cursor-pointer">
              <RadioGroupPrimitive.Item
                value={type}
                className="size-4 rounded-full border border-zinc-600 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500/20 focus:outline-none"
              >
                <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                  <span className="block size-2 rounded-full bg-red-500" />
                </RadioGroupPrimitive.Indicator>
              </RadioGroupPrimitive.Item>
              <span className="text-xs text-zinc-300 capitalize">{type}</span>
            </label>
          ))}
        </RadioGroupPrimitive.Root>
      </div>

      {/* Background Image Opacity */}
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

      {/* Background image */}
      <div className="space-y-2">
        <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">Background Image</label>
        {imageUrl && (
          <div className="relative w-32 h-20 rounded overflow-hidden border border-zinc-700">
            <Image src={imageUrl} alt="Background preview" fill className="object-cover" sizes="128px" />
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            disabled={uploadingImage}
            onClick={() => imageInputRef.current?.click()}
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
          >
            {uploadingImage ? 'Uploading…' : '↑ Upload image'}
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://… (or upload above)"
          className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* Background video */}
      <div className="space-y-2">
        <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">Background Video URL</label>
        <p className="text-xs text-zinc-600">Direct video URL (mp4/webm). Leave blank for image-only background.</p>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://… .mp4"
          className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-zinc-600"
        />
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
        {errorMsg && status !== 'error' && <span className="text-xs text-red-400">{errorMsg}</span>}
      </div>
    </div>
  )
}
