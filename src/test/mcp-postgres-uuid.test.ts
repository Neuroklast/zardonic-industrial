import { describe, expect, it } from 'vitest'
import { postgresUuid } from '@/lib/mcp/postgres-uuid'

describe('PostgreSQL UUID compatibility for imported discography records', () => {
  it.each([
    '0e9dcec0-c4af-5f1f-4f9a-0b03f3cc1832',
    '1e86b362-4ab6-5132-d8d7-18d166131778',
    '20d2c151-7829-5b03-7563-7862e29e266b',
    '7c202979-865b-5a06-db59-72f7572367e2',
    '6b653756-a69c-5a4b-90cc-412c1d371b84',
    '0472dc44-e12d-49d3-8106-750a329f5ae4',
  ])('accepts an existing PostgreSQL catalogue UUID: %s', (id) => {
    expect(postgresUuid.safeParse(id).success).toBe(true)
  })
  it.each([
    '../../releases',
    'not-a-uuid',
    '0e9dcec0-c4af-5f1f-4f9a-0b03f3cc1832;DROP',
    '00000000-0000-0000-0000-00000000000g',
    '00000000000000000000000000000000',
    '',
  ])('rejects malformed identifiers: %s', (id) => {
    expect(postgresUuid.safeParse(id).success).toBe(false)
  })
})
