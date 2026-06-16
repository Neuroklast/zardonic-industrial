export interface GalleryImageObject {
  /** Preferred source key for new data. */
  src?: string
  /** Legacy/compatibility source key still accepted by older gallery payloads and CMS records. */
  url?: string
  linkUrl?: string
}

export type GalleryImageValue = string | GalleryImageObject

export function getGalleryImageSrc(image: GalleryImageValue): string {
  if (typeof image === 'string') return image
  return image.src ?? image.url ?? ''
}

export function getGalleryImageLink(image: GalleryImageValue): string | undefined {
  if (typeof image === 'string') return undefined
  return image.linkUrl?.trim() || undefined
}
