'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { broadcastAdminDraft } from '@/lib/admin-draft-channel'
import Image from 'next/image'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { VideoSourcePicker } from '@/app/admin/_components/VideoSourcePicker'
import { resolveImageUrl } from '@/lib/r2'
import {
  DEFAULT_BACKGROUND_VIDEO_OPACITY,
  parseMobileVideoMode,
  type MobileVideoMode,
} from '@/lib/background-config'
import * as SliderPrimitive from '@radix-ui/react-slider'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

type BackgroundType = 'matrix' | 'circuit' | 'minimal'

interface BackgroundConfigEditorProps {
  currentValue: Record<string, unknown>
}

function OpacitySlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs text-zinc-400">
        {label}: <span className="font-mono text-zinc-300">{Math.round(value * 100)}%</span>
      </label>
      <SliderPrimitive.Root
        min={0}
        max={1}
        step={0.05}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="relative flex items-center w-full touch-none select-none h-5"
        aria-label={label}
      >
        <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-zinc-700">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-red-500" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-4 rounded-full border border-red-500 bg-zinc-900 shadow focus:outline-none cursor-grab" />
      </SliderPrimitive.Root>
    </div>
  )
}

export function BackgroundConfigEditor({ currentValue }: BackgroundConfigEditorProps) {
  const router = useRouter()
  const [imageStoragePath, setImageStoragePath] = useState(
    typeof currentValue.storage_path === 'string' ? currentValue.storage_path : '',
  )
  const [imageUrl, setImageUrl] = useState(
    resolveImageUrl(
      typeof currentValue.storage_path === 'string' ? currentValue.storage_path : null,
      typeof currentValue.url === 'string' ? currentValue.url : null,
    ) ?? '',
  )
  const [videoStoragePath, setVideoStoragePath] = useState(
    typeof currentValue.video_storage_path === 'string' ? currentValue.video_storage_path : '',
  )
  const [videoUrl, setVideoUrl] = useState(
    resolveImageUrl(
      typeof currentValue.video_storage_path === 'string' ? currentValue.video_storage_path : null,
      typeof currentValue.video_url === 'string' ? currentValue.video_url : null,
    ) ?? '',
  )
  const [mobileVideoStoragePath, setMobileVideoStoragePath] = useState(
    typeof currentValue.video_mobile_storage_path === 'string' ? currentValue.video_mobile_storage_path : '',
  )
  const [mobileVideoUrl, setMobileVideoUrl] = useState(
    resolveImageUrl(
      typeof currentValue.video_mobile_storage_path === 'string'
        ? currentValue.video_mobile_storage_path
        : null,
      typeof currentValue.video_mobile_url === 'string' ? currentValue.video_mobile_url : null,
    ) ?? '',
  )
  const rawBgType = currentValue.backgroundType as string | undefined
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(
    rawBgType === 'circuit' || rawBgType === 'minimal' || rawBgType === 'matrix' ? rawBgType : 'matrix',
  )
  const [backgroundImageOpacity, setBackgroundImageOpacity] = useState<number>(
    typeof currentValue.backgroundImageOpacity === 'number' ? currentValue.backgroundImageOpacity : 0.6,
  )
  const [backgroundVideoOpacity, setBackgroundVideoOpacity] = useState<number>(
    typeof currentValue.backgroundVideoOpacity === 'number'
      ? currentValue.backgroundVideoOpacity
      : DEFAULT_BACKGROUND_VIDEO_OPACITY,
  )
  const [mobileVideoMode, setMobileVideoMode] = useState<MobileVideoMode>(
    parseMobileVideoMode(currentValue.mobileVideoMode),
  )
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const draftPayload = useMemo(
    () => ({
      storage_path: imageStoragePath || undefined,
      url: imageUrl || undefined,
      video_storage_path: videoStoragePath || undefined,
      video_url: videoUrl || undefined,
      video_mobile_storage_path: mobileVideoStoragePath || undefined,
      video_mobile_url: mobileVideoUrl || undefined,
      mobileVideoMode,
      backgroundType,
      backgroundImageOpacity,
      backgroundVideoOpacity,
    }),
    [
      imageStoragePath,
      imageUrl,
      videoStoragePath,
      videoUrl,
      mobileVideoStoragePath,
      mobileVideoUrl,
      mobileVideoMode,
      backgroundType,
      backgroundImageOpacity,
      backgroundVideoOpacity,
    ],
  )

  useEffect(() => {
    broadcastAdminDraft('background', draftPayload)
  }, [draftPayload])

  function buildSavePayload() {
    return {
      storage_path: imageStoragePath || undefined,
      url: imageStoragePath ? imageUrl || undefined : imageUrl || undefined,
      video_storage_path: videoStoragePath || undefined,
      video_url: videoStoragePath ? videoUrl || undefined : videoUrl || undefined,
      video_mobile_storage_path:
        mobileVideoMode === 'separate' && mobileVideoStoragePath ? mobileVideoStoragePath : undefined,
      video_mobile_url:
        mobileVideoMode === 'separate' && mobileVideoStoragePath
          ? mobileVideoUrl || undefined
          : mobileVideoMode === 'separate'
            ? mobileVideoUrl || undefined
            : undefined,
      mobileVideoMode,
      backgroundType,
      backgroundImageOpacity,
      backgroundVideoOpacity,
    }
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    const fd = new FormData()
    fd.set('key', 'background')
    fd.set('value', JSON.stringify(buildSavePayload()))
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
        <h2 className="text-sm font-semibold text-zinc-200">Background</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Site-wide image, scroll-synced video and animation layer. Preview updates live.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">
          Animation style
        </label>
        <RadioGroupPrimitive.Root
          value={backgroundType}
          onValueChange={(v) => setBackgroundType(v as BackgroundType)}
          className="flex flex-wrap gap-4"
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

      <OpacitySlider
        label="Background image opacity"
        value={backgroundImageOpacity}
        onChange={setBackgroundImageOpacity}
      />

      <MediaSourcePicker
        label="Background image"
        currentUrl={imageUrl || null}
        storagePrefix="background/images"
        onResolved={(path, publicUrl) => {
          setImageStoragePath(path)
          if (publicUrl) setImageUrl(publicUrl)
          setErrorMsg(null)
        }}
        onError={setErrorMsg}
      />

      {imageUrl && (
        <div className="relative w-32 h-20 rounded overflow-hidden border border-zinc-700">
          <Image src={imageUrl} alt="Background preview" fill className="object-cover" sizes="128px" unoptimized />
        </div>
      )}

      <div className="space-y-4 pt-2 border-t border-zinc-800">
        <div>
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Desktop video</p>
          <p className="text-xs text-zinc-500 mt-1">Scroll-synced background video on larger screens.</p>
        </div>

        <VideoSourcePicker
          label="Desktop video (optional)"
          currentUrl={videoUrl || null}
          storagePrefix="background/videos"
          onResolved={(path, publicUrl) => {
            setVideoStoragePath(path)
            if (publicUrl) setVideoUrl(publicUrl)
            setErrorMsg(null)
          }}
          onError={setErrorMsg}
        />

        <OpacitySlider
          label="Video opacity"
          value={backgroundVideoOpacity}
          onChange={setBackgroundVideoOpacity}
        />
      </div>

      <div className="space-y-3 pt-2 border-t border-zinc-800">
        <div>
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Mobile video</p>
          <p className="text-xs text-zinc-500 mt-1">
            Phones and small tablets. Separate video saves bandwidth; off improves performance.
          </p>
        </div>
        <RadioGroupPrimitive.Root
          value={mobileVideoMode}
          onValueChange={(v) => setMobileVideoMode(v as MobileVideoMode)}
          className="space-y-2"
        >
          {(
            [
              { value: 'same', label: 'Same as desktop' },
              { value: 'separate', label: 'Different video' },
              { value: 'off', label: 'No video on mobile' },
            ] as const
          ).map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <RadioGroupPrimitive.Item
                value={value}
                className="size-4 rounded-full border border-zinc-600 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500/20 focus:outline-none"
              >
                <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                  <span className="block size-2 rounded-full bg-red-500" />
                </RadioGroupPrimitive.Indicator>
              </RadioGroupPrimitive.Item>
              <span className="text-xs text-zinc-300">{label}</span>
            </label>
          ))}
        </RadioGroupPrimitive.Root>

        {mobileVideoMode === 'separate' && (
          <VideoSourcePicker
            label="Mobile video"
            currentUrl={mobileVideoUrl || null}
            storagePrefix="background/videos/mobile"
            onResolved={(path, publicUrl) => {
              setMobileVideoStoragePath(path)
              if (publicUrl) setMobileVideoUrl(publicUrl)
              setErrorMsg(null)
            }}
            onError={setErrorMsg}
          />
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save background'}
        </button>
        {status === 'saved' && <span className="text-xs text-green-400">Saved</span>}
        {status === 'error' && <span className="text-xs text-red-400">{errorMsg ?? 'Error'}</span>}
        {errorMsg && status !== 'error' && <span className="text-xs text-red-400">{errorMsg}</span>}
      </div>
    </div>
  )
}