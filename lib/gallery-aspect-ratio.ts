/** Map admin gallery aspectRatio values to tile layout classes. */
export function resolveGalleryTileAspect(aspectRatio?: string): {
  className: string
} {
  switch (aspectRatio) {
    case '16/9':
      return { className: 'aspect-video' }
    case 'auto':
      return { className: 'aspect-auto min-h-48' }
    case 'square':
    default:
      return { className: 'aspect-square' }
  }
}