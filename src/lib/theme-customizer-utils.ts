import type { ThemeSettings, SectionVisibility } from '@/lib/types'

export function getAnimationEnabled(draft: ThemeSettings, animId: string): boolean {
  switch (animId) {
    case 'glitch': return draft.animationSettings?.glitchEnabled ?? false
    case 'scanlines': return draft.overlayEffects?.scanlines?.enabled ?? false
    case 'crt': return draft.overlayEffects?.crt?.enabled ?? false
    case 'noise': return draft.overlayEffects?.noise?.enabled ?? false
    case 'vignette': return draft.overlayEffects?.vignette?.enabled ?? false
    case 'chromatic': return draft.overlayEffects?.chromatic?.enabled ?? false
    case 'dotMatrix': return draft.overlayEffects?.dotMatrix?.enabled ?? false
    case 'particles': return draft.animationSettings?.circuitBackgroundEnabled ?? false
    default: return false
  }
}

export function getAnimationIntensity(draft: ThemeSettings, animId: string): number {
  switch (animId) {
    case 'scanlines': return draft.overlayEffects?.scanlines?.intensity ?? 0.5
    case 'crt': return draft.overlayEffects?.crt?.intensity ?? 0.5
    case 'noise': return draft.overlayEffects?.noise?.intensity ?? 0.5
    case 'vignette': return draft.overlayEffects?.vignette?.intensity ?? 0.5
    case 'chromatic': return draft.overlayEffects?.chromatic?.intensity ?? 0.5
    case 'dotMatrix': return draft.overlayEffects?.dotMatrix?.intensity ?? 0.5
    default: return 0.5
  }
}

export function setAnimationEnabled(draft: ThemeSettings, animId: string, enabled: boolean): ThemeSettings {
  switch (animId) {
    case 'glitch':
      return { ...draft, animationSettings: { ...draft.animationSettings, glitchEnabled: enabled } }
    case 'scanlines':
      return {
        ...draft,
        overlayEffects: { ...draft.overlayEffects, scanlines: { ...(draft.overlayEffects?.scanlines ?? { intensity: 0.3 }), enabled } },
        animationSettings: { ...draft.animationSettings, scanlineEnabled: enabled },
      }
    case 'crt':
      return {
        ...draft,
        overlayEffects: { ...draft.overlayEffects, crt: { ...(draft.overlayEffects?.crt ?? { intensity: 0.4 }), enabled } },
        animationSettings: { ...draft.animationSettings, crtEnabled: enabled },
      }
    case 'noise':
      return {
        ...draft,
        overlayEffects: { ...draft.overlayEffects, noise: { ...(draft.overlayEffects?.noise ?? { intensity: 0.3 }), enabled } },
        animationSettings: { ...draft.animationSettings, noiseEnabled: enabled },
      }
    case 'vignette':
      return { ...draft, overlayEffects: { ...draft.overlayEffects, vignette: { ...(draft.overlayEffects?.vignette ?? { intensity: 0.5 }), enabled } } }
    case 'chromatic':
      return {
        ...draft,
        overlayEffects: { ...draft.overlayEffects, chromatic: { ...(draft.overlayEffects?.chromatic ?? { intensity: 0.3 }), enabled } },
        animationSettings: { ...draft.animationSettings, chromaticEnabled: enabled },
      }
    case 'dotMatrix':
      return { ...draft, overlayEffects: { ...draft.overlayEffects, dotMatrix: { ...(draft.overlayEffects?.dotMatrix ?? { intensity: 0.1 }), enabled } } }
    case 'particles':
      return { ...draft, animationSettings: { ...draft.animationSettings, circuitBackgroundEnabled: enabled } }
    default:
      return draft
  }
}

export function setAnimationIntensity(draft: ThemeSettings, animId: string, intensity: number): ThemeSettings {
  switch (animId) {
    case 'scanlines':
      return { ...draft, overlayEffects: { ...draft.overlayEffects, scanlines: { ...(draft.overlayEffects?.scanlines ?? { enabled: false }), intensity } } }
    case 'crt':
      return { ...draft, overlayEffects: { ...draft.overlayEffects, crt: { ...(draft.overlayEffects?.crt ?? { enabled: false }), intensity } } }
    case 'noise':
      return { ...draft, overlayEffects: { ...draft.overlayEffects, noise: { ...(draft.overlayEffects?.noise ?? { enabled: false }), intensity } } }
    case 'vignette':
      return { ...draft, overlayEffects: { ...draft.overlayEffects, vignette: { ...(draft.overlayEffects?.vignette ?? { enabled: false }), intensity } } }
    case 'chromatic':
      return { ...draft, overlayEffects: { ...draft.overlayEffects, chromatic: { ...(draft.overlayEffects?.chromatic ?? { enabled: false }), intensity } } }
    case 'dotMatrix':
      return { ...draft, overlayEffects: { ...draft.overlayEffects, dotMatrix: { ...(draft.overlayEffects?.dotMatrix ?? { enabled: false }), intensity } } }
    default:
      return draft
  }
}

export const SECTION_LABELS: Record<keyof SectionVisibility, string> = {
  bio: 'Biography Section',
  music: 'Music Section',
  gigs: 'Gigs Section',
  releases: 'Releases Section',
  gallery: 'Gallery Section',
  connect: 'Connect Section',
  creditHighlights: 'Credits Section',
  shell: 'Shell / Members Section',
  contact: 'Contact Section',
}

export const SECTION_DISPLAY_NAMES: Record<string, string> = {
  bio: 'Biografie',
  music: 'Musik',
  gigs: 'Live Gigs',
  releases: 'Releases',
  gallery: 'Galerie',
  connect: 'Connect',
  creditHighlights: 'Credits',
  shell: 'Shell / Members',
  contact: 'Kontakt',
}
