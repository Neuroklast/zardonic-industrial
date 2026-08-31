import { describe, it, expect, vi } from 'vitest'
import {
  FACTORY_RESET_CONFIRM,
  FACTORY_RESET_TABLES,
  FACTORY_RESET_SITE_CONFIG,
  performFactoryReset,
} from '@/lib/factory-reset'

function makeClient() {
  const deleted: Record<string, number> = {}
  const upserted: unknown[][] = []
  return {
    client: {
      from(table: string) {
        return {
          delete: async ({ count } = { count: 'exact' as const }) => {
            void count
            const n = table === 'releases' ? 7 : 3
            deleted[table] = n
            return { count: n, error: null }
          },
          upsert: async (rows: unknown[]) => {
            upserted.push(rows)
            return { error: null }
          },
        }
      },
    },
    deleted,
    upserted,
  }
}

describe('performFactoryReset', () => {
  it('throws before touching data when the confirm phrase does not match', async () => {
    const { client, deleted } = makeClient()
    await expect(
      performFactoryReset(client as never, { confirm: 'nope', deleteR2Media: false }),
    ).rejects.toThrow(/confirmation phrase/i)
    expect(Object.keys(deleted)).toHaveLength(0)
  })

  it('wipes every content table and reports counts', async () => {
    const { client, deleted } = makeClient()
    const result = await performFactoryReset(client as never, {
      confirm: FACTORY_RESET_CONFIRM,
      deleteR2Media: false,
    })
    expect(Object.keys(deleted).sort()).toEqual([...FACTORY_RESET_TABLES].sort())
    expect(result.deleted.releases).toBe(7)
    expect(result.r2MediaDeleted).toBe(false)
  })

  it('re-seeds the canonical site_config defaults', async () => {
    const { client, upserted } = makeClient()
    const result = await performFactoryReset(client as never, {
      confirm: FACTORY_RESET_CONFIRM,
      deleteR2Media: false,
    })
    expect(result.seededCount).toBe(FACTORY_RESET_SITE_CONFIG.length)
    const seeded = upserted[0] as Array<{ key: string }>
    expect(seeded.map((row) => row.key)).toEqual(
      FACTORY_RESET_SITE_CONFIG.map((seed) => seed.key),
    )
  })

  it('records a skip when a table delete fails instead of throwing', async () => {
    const failing = {
      from(table: string) {
        return {
          delete: async () =>
            table === 'gigs' ? { count: 0, error: { message: 'no access' } } : { count: 2, error: null },
          upsert: async () => ({ error: null }),
        }
      },
    }
    const result = await performFactoryReset(failing as never, {
      confirm: FACTORY_RESET_CONFIRM,
      deleteR2Media: false,
    })
    expect(result.skips.length).toBeGreaterThan(0)
    expect(result.skips[0]).toContain('gigs')
  })
})
