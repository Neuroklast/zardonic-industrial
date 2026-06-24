const LENIS_SCROLL_KEYWORDS = new Set(['top', 'left', 'start', 'bottom', 'right', 'end', '#'])

/** Lenis querySelector needs `#id`; bare ids (e.g. `releases`) fail silently. */
export function resolveScrollTarget(target: HTMLElement | string | number): HTMLElement | string | number {
  if (typeof target !== 'string') return target

  const trimmed = target.trim()
  if (trimmed.startsWith('#') || LENIS_SCROLL_KEYWORDS.has(trimmed)) return trimmed

  const byId = document.getElementById(trimmed)
  if (byId) return byId

  return `#${trimmed}`
}