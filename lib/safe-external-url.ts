import { z } from 'zod'
import { sanitizeExternalHref } from '@/lib/sanitize-href'

export { sanitizeExternalHref }

/**
 * Shared hardening for any user/admin-supplied URL that ends up in an `href`
 * or `src`. Bare `z.string().url()` accepts `javascript:`, `data:`, `vbscript:`
 * (any scheme that parses as a URL). Restricting to `http`/`https` prevents
 * click-to-XSS and scriptable-URL injection.
 */
export const safeExternalUrl = z
  .string()
  .url()
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol
      return protocol === 'https:' || protocol === 'http:'
    } catch {
      return false
    }
  }, 'URL must use http or https')

/** Optional http(s) URL that may be empty or null. */
export const safeExternalUrlOptional = safeExternalUrl
  .optional()
  .nullable()
  .or(z.literal(''))

/** Nullable http(s) URL (no empty-string alternative). */
export const safeExternalUrlNullable = safeExternalUrl.nullable().optional()
