export const DEFAULT_MAX_IMAGE_WIDTH = 2400
export const DEFAULT_MAX_IMAGE_HEIGHT = 2400
/** Hero wordmark / logos — keep full detail for large displays and retina. */
export const HERO_LOGO_MAX_IMAGE_WIDTH = 4096
export const HERO_LOGO_MAX_IMAGE_HEIGHT = 4096
export const WEBP_QUALITY = 82
export const JPEG_QUALITY = 85
export const HERO_LOGO_WEBP_QUALITY = 95

/**
 * Max FormData payload for image Server Actions.
 * Next default is 1 MB; we raise bodySizeLimit to 4 MB in next.config.
 * Leave headroom under Vercel’s ~4.5 MB serverless request body.
 */
export const SERVER_ACTION_IMAGE_UPLOAD_MAX_BYTES = 3.5 * 1024 * 1024