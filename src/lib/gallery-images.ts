export interface GalleryImageObject {
  src?: string
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
