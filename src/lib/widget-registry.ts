/**
 * Widget Registry – license-aware catalog of all available widgets.
 */
import type { ThemeLicenseStatus, WidgetPlugin } from './types'

export interface WidgetDefinition {
  id: string
  name: string
  description?: string
  previewImageUrl?: string
  licenseStatus: ThemeLicenseStatus
  licenseKeyPrefix?: string
  category: WidgetPlugin['category']
  author?: string
  tags?: string[]
  version: string
}

export const WIDGET_CATALOG: WidgetDefinition[] = [
  {
    id: 'bandsintown',
    name: 'Bandsintown Events',
    description: 'Show upcoming gigs from Bandsintown',
    licenseStatus: 'free',
    category: 'events',
    author: 'Neuroklast',
    version: '1.0.0',
    tags: ['events', 'gigs', 'live'],
  },
  {
    id: 'youtube',
    name: 'YouTube Player',
    description: 'Embed a YouTube playlist or video',
    licenseStatus: 'free',
    category: 'video',
    author: 'Neuroklast',
    version: '1.0.0',
    tags: ['video', 'youtube'],
  },
  {
    id: 'spotify-player',
    name: 'Spotify Player',
    description: 'Embed a Spotify playlist or album',
    licenseStatus: 'free',
    category: 'music',
    author: 'Neuroklast',
    version: '1.0.0',
    tags: ['music', 'spotify'],
  },
  {
    id: 'merch-store',
    name: 'Merch Store',
    description: 'Showcase merchandise links',
    licenseStatus: 'free',
    category: 'merch',
    author: 'Neuroklast',
    version: '1.0.0',
    tags: ['merch', 'shop'],
  },
  {
    id: 'analytics',
    name: 'Analytics Widget',
    description: 'Quick stats summary for your site',
    licenseStatus: 'free',
    category: 'analytics',
    author: 'Neuroklast',
    version: '1.0.0',
    tags: ['analytics', 'stats'],
  },
]

export interface WidgetRegistry {
  widgets: WidgetDefinition[]
  getWidget(id: string): WidgetDefinition | undefined
  getLicenseStatus(id: string): ThemeLicenseStatus
  isUnlocked(id: string): boolean
}

export function createWidgetRegistry(unlockedWidgetIds: string[] = []): WidgetRegistry {
  const unlockedSet = new Set(unlockedWidgetIds)

  function getEffectiveStatus(def: WidgetDefinition): ThemeLicenseStatus {
    if (def.licenseStatus === 'free') return 'free'
    if (unlockedSet.has(def.id)) return 'licensed'
    return def.licenseStatus
  }

  return {
    widgets: WIDGET_CATALOG,

    getWidget(id: string) {
      return WIDGET_CATALOG.find((w) => w.id === id)
    },

    getLicenseStatus(id: string) {
      const def = WIDGET_CATALOG.find((w) => w.id === id)
      if (!def) return 'locked'
      return getEffectiveStatus(def)
    },

    isUnlocked(id: string) {
      const def = WIDGET_CATALOG.find((w) => w.id === id)
      if (!def) return false
      const status = getEffectiveStatus(def)
      return status === 'free' || status === 'licensed'
    },
  }
}
