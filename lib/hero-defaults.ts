/** Default hero wordmark (ZARDONIC PNG) bundled in /public. */
export const DEFAULT_HERO_LOGO_URL =
  '/assets/images/meta_eyJzcmNCdWNrZXQiOiJiemdsZmlsZXMifQ==.webp'

export function resolveHeroLogoUrl(
  storagePath: string | null | undefined,
  fallbackUrl: string | null | undefined,
  resolve: (storage: string | null, url: string | null) => string | null,
): string {
  const resolved = resolve(storagePath ?? null, fallbackUrl ?? null)
  return resolved ?? DEFAULT_HERO_LOGO_URL
}