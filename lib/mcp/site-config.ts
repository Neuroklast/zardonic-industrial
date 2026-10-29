import { z } from 'zod'

// Only public-facing copy is editable. Legal links, analytics, appearance,
// integrations, secrets and commerce configuration are intentionally absent.
const copy = z.string().max(12000)
const url = z.string().max(2048).refine((value) => {
  if ((value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) || /^#[a-zA-Z0-9_-]+$/.test(value)) return true
  try { return new URL(value).protocol === 'https:' } catch { return false }
}, 'Expected relative URL or HTTPS URL')

const locale = z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/)
const translationKey = z.string().min(1).max(120).regex(/^[a-zA-Z0-9.-]+$/)
  .refine((key) => key !== 'constructor' && key !== 'prototype', 'Reserved translation key')
const translationValue = z.record(locale, z.string().max(2000))
const translations = z.record(translationKey, translationValue)
  .refine((value) => Object.keys(value).length <= 120, 'Too many translation keys')
  .refine((value) => JSON.stringify(value).length <= 32000, 'Translation patch too large')
const CONFIG = {
  hero: z.object({
    headline: copy,
    tagline: copy,
    ctaLabel: copy,
    ctaUrl: url,
  }).partial().strict(),
  merchandise: z.object({
    footerText: copy,
    footerUrl: url,
  }).partial().strict(),
  translations,
} as const

export const READABLE_SITE_CONTENT = ['hero', 'merchandise', 'translations', 'sections'] as const
export const WRITABLE_SITE_CONTENT = Object.keys(CONFIG)

export function canReadSiteContent(key: string): boolean {
  return READABLE_SITE_CONTENT.some((item) => item === key)
}

export function parseSiteContentPatch(key: string, payload: unknown): Record<string, unknown> {
  const schema = CONFIG[key as keyof typeof CONFIG] as z.ZodType | undefined
  if (!Object.prototype.hasOwnProperty.call(CONFIG, key) || !schema) {
    throw new Error('This site configuration is read-only')
  }
  const parsed = schema.safeParse(payload)
  if (!parsed.success || !parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
    throw new Error('Invalid site text patch')
  }
  const result = parsed.data as Record<string, unknown>
  if (!Object.keys(result).length) throw new Error('An empty patch cannot be submitted')
  return result
}

export function mergeSiteContent(key: string, previous: unknown, changes: Record<string, unknown>): Record<string, unknown> {
  const original = previous && typeof previous === 'object' && !Array.isArray(previous)
    ? previous as Record<string, unknown>
    : {}
  if (key !== 'translations') return { ...original, ...changes }
  const merged: Record<string, unknown> = { ...original }
  for (const [translationKey, patch] of Object.entries(changes)) {
    const existing = original[translationKey]
    const base = existing && typeof existing === 'object' && !Array.isArray(existing)
      ? existing as Record<string, unknown>
      : {}
    merged[translationKey] = { ...base, ...(patch as Record<string, unknown>) }
  }
  return merged
}
