'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { applyAppearanceConfig } from '@/lib/apply-appearance-config'
import { applySectionsDraft } from '@/lib/apply-sections-draft'
import { DEFAULT_HERO_LOGO_URL } from '@/lib/hero-defaults'
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

  const logoUrl =
    typeof value.logoImageUrl === 'string' && value.logoImageUrl
      ? value.logoImageUrl
      : DEFAULT_HERO_LOGO_URL
  document.querySelectorAll<HTMLImageElement>('[data-draft-target="hero-logo"]').forEach((img) => {
    img.src = logoUrl
  })
  // Width-only: separate desktop / mobile % of content column (height follows aspect ratio).
  const clampW = (n: number) => Math.min(100, Math.max(15, Math.round(n)))
  let widthPct: number | null = null
  if (typeof value.logoWidthPercent === 'number' && Number.isFinite(value.logoWidthPercent)) {
    widthPct = clampW(value.logoWidthPercent)
  } else if (typeof value.logoMaxHeightRem === 'number' && Number.isFinite(value.logoMaxHeightRem)) {
    widthPct = clampW((value.logoMaxHeightRem / 48) * 100)
  }
  const widthPctMobile =
    typeof value.logoWidthPercentMobile === 'number' && Number.isFinite(value.logoWidthPercentMobile)
      ? clampW(value.logoWidthPercentMobile)
      : widthPct != null
        ? clampW(Math.max(widthPct, 90))
        : null
  if (widthPct != null || widthPctMobile != null) {
    const widthCss = widthPct != null ? `${widthPct}%` : null
    const widthMobileCss = widthPctMobile != null ? `${widthPctMobile}%` : null
    document.querySelectorAll<HTMLElement>('.hero-logo-stage').forEach((el) => {
      if (widthCss) el.style.setProperty('--hero-logo-width', widthCss)
      if (widthMobileCss) el.style.setProperty('--hero-logo-width-mobile', widthMobileCss)
    })
    // Clear any old inline width override so CSS media queries can switch desktop/mobile.
    document.querySelectorAll<HTMLElement>('.hero-logo-glitch').forEach((el) => {
      if (widthCss) el.style.setProperty('--hero-logo-width', widthCss)
      if (widthMobileCss) el.style.setProperty('--hero-logo-width-mobile', widthMobileCss)
      el.style.removeProperty('width')
      el.style.height = 'auto'
      el.style.maxHeight = 'none'
    })
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

function applyNewsletterDraft(value: Record<string, unknown>) {
  if (typeof value.heading === 'string') {
    const headingEl = document.querySelector('[data-draft-target="newsletter-heading"]')
    if (headingEl) {
      const text = value.heading.trim() ? value.heading.toUpperCase() : 'STAY CONNECTED'
      headingEl.textContent = text
      if (headingEl instanceof HTMLElement) headingEl.dataset.text = text
    }
  }
  if (typeof value.body === 'string') {
    const bodyEl = document.querySelector('[data-draft-target="newsletter-body"]')
    if (bodyEl) bodyEl.textContent = value.body
  }
}

function applyMerchandiseDraft(value: Record<string, unknown>) {
  if (typeof value.footerText !== 'string') return
  const footerEl = document.querySelector('[data-draft-target="merchandise-footer"]')
  if (!footerEl) return
  footerEl.textContent = value.footerText
  if (footerEl instanceof HTMLElement) {
    footerEl.style.display = value.footerText ? '' : 'none'
  }
}

function applyFooterDraft(value: Record<string, unknown>) {
  if (typeof value.legalNoticeUrl === 'string') {
    const legalEl = document.querySelector<HTMLAnchorElement>('[data-draft-target="footer-legal"]')
    if (legalEl) legalEl.href = value.legalNoticeUrl
  }
  if (typeof value.privacyPolicyUrl === 'string') {
    document
      .querySelectorAll<HTMLAnchorElement>('[data-draft-target="footer-privacy"]')
      .forEach((el) => {
        el.href = value.privacyPolicyUrl as string
      })
  }
}

/**
 * Live admin drafts only apply when the public page is opened as the admin
 * preview iframe (`?adminPreview=1`). The real public site updates only after
 * Save → revalidate + broadcastAdminRefresh.
 */
export function AdminDraftListener({ enableDrafts = false }: { enableDrafts?: boolean }) {
  const router = useRouter()

  const onDraft = useCallback(
    (key: AdminDraftKey, value: Record<string, unknown>) => {
      if (!enableDrafts) return
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
        case 'sections':
          applySectionsDraft(value)
          break
        case 'newsletter':
          applyNewsletterDraft(value)
          break
        case 'merchandise':
          applyMerchandiseDraft(value)
          break
        case 'footer':
          applyFooterDraft(value)
          break
        default:
          break
      }
    },
    [enableDrafts],
  )

  const onRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  // Always listen for refresh so public tabs pick up saves; drafts only when preview
  useAdminDraftListener(onDraft, onRefresh)

  return null
}