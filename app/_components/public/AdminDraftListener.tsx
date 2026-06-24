'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { applyAppearanceConfig } from '@/lib/apply-appearance-config'
import { useAdminDraftListener } from '@/hooks/use-admin-draft'
import type { AdminDraftKey } from '@/lib/admin-draft-channel'

function applyHeroDraft(value: Record<string, unknown>) {
  const taglineEl = document.querySelector('[data-draft-target="hero-tagline"]')
  if (taglineEl && typeof value.tagline === 'string') taglineEl.textContent = value.tagline

  const ctaEl = document.querySelector('[data-draft-target="hero-cta"]')
  if (ctaEl && typeof value.ctaLabel === 'string') ctaEl.textContent = value.ctaLabel

  const ctaLink = document.querySelector<HTMLAnchorElement>('[data-draft-target="hero-cta-link"]')
  if (ctaLink) {
    if (typeof value.ctaUrl === 'string') ctaLink.href = value.ctaUrl
    if (typeof value.ctaLabel === 'string') {
      const span = ctaLink.querySelector('span')
      if (span) span.textContent = value.ctaLabel
    }
  }

  const heroBgEl = document.querySelector<HTMLElement>('[data-draft-target="hero-bg-image"]')
  if (heroBgEl) {
    if (typeof value.backgroundImageUrl === 'string' && value.backgroundImageUrl) {
      heroBgEl.style.backgroundImage = `url(${value.backgroundImageUrl})`
      heroBgEl.style.display = ''
    } else if (value.backgroundImageUrl === undefined || value.backgroundImageUrl === '') {
      heroBgEl.style.backgroundImage = ''
      heroBgEl.style.display = 'none'
    }
    if (typeof value.backgroundImageOpacity === 'number') {
      heroBgEl.style.opacity = String(value.backgroundImageOpacity)
    }
  }
}

function applyBackgroundDraft(value: Record<string, unknown>) {
  const bgEl = document.querySelector<HTMLElement>('[data-draft-target="bg-image"]')
  if (bgEl) {
    if (typeof value.url === 'string' && value.url) {
      const img = bgEl.querySelector('img')
      if (img) img.src = value.url
      else bgEl.style.backgroundImage = `url(${value.url})`
      bgEl.style.display = ''
    } else if (value.url === undefined || value.url === '') {
      bgEl.style.display = 'none'
    }
    if (typeof value.backgroundImageOpacity === 'number') {
      bgEl.style.opacity = String(value.backgroundImageOpacity)
    }
  }

  const videoWrap = document.querySelector<HTMLElement>('[data-draft-target="bg-video-wrap"]')
  if (videoWrap && typeof value.backgroundVideoOpacity === 'number') {
    videoWrap.style.opacity = String(value.backgroundVideoOpacity)
  }

  const videoEl = document.querySelector<HTMLVideoElement>('[data-draft-target="bg-video"]')
  if (videoEl && typeof value.video_url === 'string') {
    if (value.video_url) {
      const source = videoEl.querySelector('source')
      if (source) source.src = value.video_url
      else videoEl.src = value.video_url
      videoEl.load()
      videoWrap?.removeAttribute('hidden')
    } else {
      videoWrap?.setAttribute('hidden', '')
    }
  }
}

export function AdminDraftListener() {
  const router = useRouter()

  const onDraft = useCallback((key: AdminDraftKey, value: Record<string, unknown>) => {
    switch (key) {
      case 'appearance':
        applyAppearanceConfig(value)
        break
      case 'hero':
        applyHeroDraft(value)
        break
      case 'background':
        applyBackgroundDraft(value)
        break
      default:
        break
    }
  }, [])

  const onRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  useAdminDraftListener(onDraft, onRefresh)

  return null
}