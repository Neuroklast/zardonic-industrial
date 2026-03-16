/**
 * Section registry and utility functions for enabling/disabling and reordering
 * site sections.
 */

import type { SectionConfig } from './types'
import { DEFAULT_SECTION_ORDER } from './site-config'

export const ALL_SECTION_IDS: readonly string[] = DEFAULT_SECTION_ORDER

export function buildDefaultSections(): SectionConfig[] {
  return ALL_SECTION_IDS.map((id, index) => ({
    id,
    enabled: true,
    order: index,
  }))
}

export function normalizeSections(configs: SectionConfig[]): SectionConfig[] {
  const configMap = new Map(configs.map((c) => [c.id, c]))
  const maxOrder = configs.reduce((max, c) => Math.max(max, c.order), -1)
  let nextOrder = maxOrder + 1

  for (const id of ALL_SECTION_IDS) {
    if (!configMap.has(id)) {
      configMap.set(id, { id, enabled: true, order: nextOrder++ })
    }
  }

  return Array.from(configMap.values()).sort((a, b) => a.order - b.order)
}

export function migrateSectionOrder(sectionOrder: string[]): SectionConfig[] {
  return sectionOrder.map((id, index) => ({
    id,
    enabled: true,
    order: index,
  }))
}

export function resolveSections(config: {
  sections?: SectionConfig[]
  sectionOrder?: string[]
}): SectionConfig[] {
  if (config.sections && config.sections.length > 0) {
    return normalizeSections(config.sections)
  }
  if (config.sectionOrder && config.sectionOrder.length > 0) {
    return migrateSectionOrder(config.sectionOrder)
  }
  return buildDefaultSections()
}

export function getEnabledSections(configs: SectionConfig[]): SectionConfig[] {
  return normalizeSections(configs)
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
}

export function getEnabledSectionIds(configs: SectionConfig[]): string[] {
  return getEnabledSections(configs).map((s) => s.id)
}

export function toggleSection(configs: SectionConfig[], id: string): SectionConfig[] {
  const normalized = normalizeSections(configs)
  return normalized.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
}

export function reorderSections(
  configs: SectionConfig[],
  id: string,
  newOrder: number,
): SectionConfig[] {
  const normalized = normalizeSections(configs)
  const sorted = [...normalized].sort((a, b) => a.order - b.order)

  const fromIndex = sorted.findIndex((s) => s.id === id)
  if (fromIndex === -1) return normalized

  const toIndex = Math.max(0, Math.min(newOrder, sorted.length - 1))
  if (fromIndex === toIndex) return normalized

  const [moved] = sorted.splice(fromIndex, 1)
  sorted.splice(toIndex, 0, moved)

  return sorted.map((s, i) => ({ ...s, order: i }))
}
