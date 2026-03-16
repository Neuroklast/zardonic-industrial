import { describe, it, expect } from 'vitest'
import {
  buildDefaultMemberSlots,
  migrateToMemberSlots,
  isSlotFilled,
  getFilledSlots,
  getEntitySlots,
  getEngineerSlots,
  updateMemberSlot,
  clearMemberSlot,
  slotsToShellMembers,
} from '@/lib/member-slots'
import { ENTITY_SLOT_COUNT, ENGINEER_SLOT_COUNT } from '@/lib/types'

// ---------------------------------------------------------------------------
describe('buildDefaultMemberSlots()', () => {
  it('returns 8 total slots', () => {
    const slots = buildDefaultMemberSlots()
    expect(slots).toHaveLength(ENTITY_SLOT_COUNT + ENGINEER_SLOT_COUNT)
  })

  it('has 7 entity slots', () => {
    const slots = buildDefaultMemberSlots()
    const entities = slots.filter((s) => s.slotType === 'entity')
    expect(entities).toHaveLength(7)
  })

  it('has 1 engineer slot', () => {
    const slots = buildDefaultMemberSlots()
    const engineers = slots.filter((s) => s.slotType === 'engineer')
    expect(engineers).toHaveLength(1)
  })

  it('all default slots are empty', () => {
    const slots = buildDefaultMemberSlots()
    expect(slots.every((s) => !isSlotFilled(s))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
describe('migrateToMemberSlots()', () => {
  it('fills entity slots from legacy shellMembers', () => {
    const legacy = [
      { name: 'Alice', role: 'Vocals' },
      { name: 'Bob', role: 'Guitar' },
    ]
    const slots = migrateToMemberSlots(legacy)
    expect(slots[0].name).toBe('Alice')
    expect(slots[0].slotType).toBe('entity')
    expect(slots[1].name).toBe('Bob')
    expect(slots[1].slotType).toBe('entity')
  })

  it('fills from single shellMember when array not provided', () => {
    const slots = migrateToMemberSlots(undefined, { name: 'Solo', role: 'DJ' })
    expect(slots[0].name).toBe('Solo')
    expect(slots[0].slotType).toBe('entity')
  })

  it('returns default slots when no legacy data', () => {
    const slots = migrateToMemberSlots()
    expect(slots).toHaveLength(8)
    expect(slots.every((s) => !isSlotFilled(s))).toBe(true)
  })

  it('assigns engineer slotType to slot at entity count index', () => {
    const members = Array.from({ length: 8 }, (_, i) => ({ name: `Member ${i}` }))
    const slots = migrateToMemberSlots(members)
    expect(slots[7].slotType).toBe('engineer')
    expect(slots[7].name).toBe('Member 7')
  })
})

// ---------------------------------------------------------------------------
describe('isSlotFilled()', () => {
  it('returns false for empty slot', () => {
    expect(isSlotFilled({ slotType: 'entity', slotIndex: 0 })).toBe(false)
  })

  it('returns true when slot has name', () => {
    expect(isSlotFilled({ slotType: 'entity', slotIndex: 0, name: 'Alice' })).toBe(true)
  })

  it('returns true when slot has role', () => {
    expect(isSlotFilled({ slotType: 'entity', slotIndex: 0, role: 'Guitar' })).toBe(true)
  })

  it('returns true when slot has bio', () => {
    expect(isSlotFilled({ slotType: 'entity', slotIndex: 0, bio: 'About me' })).toBe(true)
  })

  it('returns true when slot has photo', () => {
    expect(isSlotFilled({ slotType: 'entity', slotIndex: 0, photo: 'url' })).toBe(true)
  })
})

// ---------------------------------------------------------------------------
describe('getFilledSlots()', () => {
  it('returns only slots with content', () => {
    const slots = buildDefaultMemberSlots()
    slots[0] = { ...slots[0], name: 'Alice' }
    slots[2] = { ...slots[2], role: 'Bass' }
    const filled = getFilledSlots(slots)
    expect(filled).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
describe('getEntitySlots()', () => {
  it('returns 7 entity slots', () => {
    const slots = buildDefaultMemberSlots()
    expect(getEntitySlots(slots)).toHaveLength(7)
  })

  it('all returned slots have slotType entity', () => {
    const slots = buildDefaultMemberSlots()
    getEntitySlots(slots).forEach((s) => expect(s.slotType).toBe('entity'))
  })
})

// ---------------------------------------------------------------------------
describe('getEngineerSlots()', () => {
  it('returns 1 engineer slot', () => {
    const slots = buildDefaultMemberSlots()
    expect(getEngineerSlots(slots)).toHaveLength(1)
  })

  it('returned slot has slotType engineer', () => {
    const slots = buildDefaultMemberSlots()
    getEngineerSlots(slots).forEach((s) => expect(s.slotType).toBe('engineer'))
  })
})

// ---------------------------------------------------------------------------
describe('updateMemberSlot()', () => {
  it('updates a specific slot', () => {
    const slots = buildDefaultMemberSlots()
    const updated = updateMemberSlot(slots, 0, { name: 'Alice', role: 'Vocals' })
    expect(updated[0].name).toBe('Alice')
    expect(updated[0].role).toBe('Vocals')
    expect(updated[0].slotType).toBe('entity')
  })

  it('does not modify other slots', () => {
    const slots = buildDefaultMemberSlots()
    const updated = updateMemberSlot(slots, 0, { name: 'Alice' })
    expect(updated[1].name).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
describe('clearMemberSlot()', () => {
  it('resets slot to empty while preserving type and index', () => {
    const slots = buildDefaultMemberSlots()
    const filled = updateMemberSlot(slots, 0, { name: 'Alice', role: 'Vocals' })
    const cleared = clearMemberSlot(filled, 0)
    expect(cleared[0].name).toBeUndefined()
    expect(cleared[0].role).toBeUndefined()
    expect(cleared[0].slotType).toBe('entity')
    expect(cleared[0].slotIndex).toBe(0)
  })
})

// ---------------------------------------------------------------------------
describe('slotsToShellMembers()', () => {
  it('converts filled slots back to legacy ShellMember format', () => {
    const slots = buildDefaultMemberSlots()
    const filled = updateMemberSlot(
      updateMemberSlot(slots, 0, { name: 'Alice', role: 'Vocals' }),
      1,
      { name: 'Bob', role: 'Guitar' },
    )
    const members = slotsToShellMembers(filled)
    expect(members).toHaveLength(2)
    expect(members[0]).toEqual({ name: 'Alice', role: 'Vocals' })
    expect(members[1]).toEqual({ name: 'Bob', role: 'Guitar' })
  })

  it('excludes empty slots', () => {
    const slots = buildDefaultMemberSlots()
    const members = slotsToShellMembers(slots)
    expect(members).toHaveLength(0)
  })

  it('strips slotType and slotIndex from output', () => {
    const slots = updateMemberSlot(buildDefaultMemberSlots(), 0, { name: 'Solo' })
    const members = slotsToShellMembers(slots)
    expect(members[0]).not.toHaveProperty('slotType')
    expect(members[0]).not.toHaveProperty('slotIndex')
  })
})
