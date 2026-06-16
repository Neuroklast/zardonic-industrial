/**
 * AdminSchemaRegistry — Phase 1 Foundation Layer
 *
 * A singleton registry that collects all `AdminSectionSchema` definitions.
 * Every admin-editable section MUST call `registerAdminSection()` at module
 * load time so the registry knows about it.
 *
 * Guarantees:
 *   - Duplicate `sectionId` registrations throw at development time.
 *   - `getSections()` returns sections in registration order.
 *   - `getSection(id)` returns `undefined` for unknown sections (never throws).
 *   - TypeScript enforces `AdminSectionSchema<T>` shape at the call site.
 *
 * Usage:
 * ```typescript
 * // In src/cms/section-schemas/hero-schema.ts:
 * import { registerAdminSection } from '@/lib/admin-schema-registry'
 *
 * registerAdminSection({
 *   sectionId: 'hero',
 *   label: 'Hero',
 *   icon: 'House',
 *   description: 'Full-bleed hero section at the top of the page.',
 *   fields: [ ... ],
 *   supportsPreview: true,
 *   getDefaultData: () => ({ artistName: '', heroImage: '' }),
 * })
 * ```
 *
 * ```typescript
 * // Anywhere in the admin UI:
 * import { getSections, getSection } from '@/lib/admin-schema-registry'
 *
 * const all = getSections()
 * const hero = getSection('hero')
 * ```
 */

import type { AdminSectionSchema } from './admin-section-schema'

// ─── Internal registry map ────────────────────────────────────────────────────

/**
 * Internal ordered map: sectionId → AdminSectionSchema.
 * `Map` preserves insertion order so `getSections()` returns a stable list.
 */
const _registry = new Map<string, AdminSectionSchema>()

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Register an `AdminSectionSchema` with the global registry.
 *
 * Throws (in development) if a section with the same `sectionId` has already
 * been registered, preventing silent overwrites caused by duplicate imports.
 *
 * @param schema - The complete section schema to register.
 * @throws {Error} When `schema.sectionId` is already registered.
 */
export function registerAdminSection<T>(schema: AdminSectionSchema<T>): void {
  if (_registry.has(schema.sectionId)) {
    // Only throw in non-test/non-prod to allow test re-registration:
    // In tests, schemas may be imported multiple times due to module caching.
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        `[AdminSchemaRegistry] Duplicate registration for sectionId "${schema.sectionId}". ` +
          'Each section may only be registered once.',
      )
    }
    return
  }
  _registry.set(schema.sectionId, schema as AdminSectionSchema)
}

/**
 * Returns all registered schemas in the order they were registered.
 * Call `import '@/cms/section-schemas'` (the barrel) before using this
 * to ensure all schemas are loaded.
 */
export function getSections(): AdminSectionSchema[] {
  return Array.from(_registry.values())
}

/**
 * Returns the registered schema for a given section ID, or `undefined`
 * if no schema has been registered for that ID.
 */
export function getSection(id: string): AdminSectionSchema | undefined {
  return _registry.get(id)
}

/**
 * Returns `true` when a schema with the given ID has been registered.
 */
export function hasSection(id: string): boolean {
  return _registry.has(id)
}

/**
 * Clears all registered schemas.
 *
 * **For testing only.** Never call this in application code.
 */
export function _clearRegistryForTesting(): void {
  _registry.clear()
}
