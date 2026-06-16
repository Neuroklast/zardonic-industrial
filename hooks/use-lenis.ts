/**
 * useLenis — convenience hook for accessing the Lenis smooth-scroll context.
 *
 * Re-exports {@link useLenisContext} so components can import from a single
 * hooks path (`@/hooks/use-lenis`) without knowing about the context module.
 *
 * @example
 * ```tsx
 * const { scrollTo } = useLenis()
 * scrollTo(element, { offset: -80 })
 * ```
 */
export { useLenisContext as useLenis } from '@/contexts/LenisContext'
export type { LenisContextValue, LenisScrollToOptions } from '@/contexts/LenisContext'
