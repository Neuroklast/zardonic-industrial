/**
 * Member Slot Management
 * 
 * Provides utilities for managing the fixed member slot structure:
 * - 7 entity slots (band members / artists)
 * - 1 engineer slot (sound engineer / technical)
 * 
 * Total: 8 fixed slots
 */

import type { ShellMember, ShellMemberSlot, ShellMemberSlotType } from './types'
import { ENTITY_SLOT_COUNT, ENGINEER_SLOT_COUNT, TOTAL_MEMBER_SLOTS } from './types'

/** Labels for slot types */
export const SLOT_TYPE_LABELS: Record<ShellMemberSlotType, string> = {
  entity: 'ENTITY',
  engineer: 'ENGINEER',
}

/** Build the default empty slot array (7 entities + 1 engineer) */
export function buildDefaultMemberSlots(): ShellMemberSlot[] {
  const slots: ShellMemberSlot[] = []

  for (let i = 0; i < ENTITY_SLOT_COUNT; i++) {
    slots.push({
      slotType: 'entity',
      slotIndex: i,
    })
  }

  for (let i = 0; i < ENGINEER_SLOT_COUNT; i++) {
    slots.push({
      slotType: 'engineer',
      slotIndex: ENTITY_SLOT_COUNT + i,
    })
  }

  return slots
}

/**
 * Migrate legacy shellMembers array to the fixed slot structure.
 * Existing members fill entity slots first, then engineer slot if present.
 */
export function migrateToMemberSlots(
  shellMembers?: ShellMember[],
  shellMember?: ShellMember,
): ShellMemberSlot[] {
  const slots = buildDefaultMemberSlots()
  const legacy = shellMembers || (shellMember ? [shellMember] : [])

  for (let i = 0; i < legacy.length && i < TOTAL_MEMBER_SLOTS; i++) {
    const member = legacy[i]
    if (member) {
      slots[i] = {
        ...member,
        slotType: i < ENTITY_SLOT_COUNT ? 'entity' : 'engineer',
        slotIndex: i,
      }
    }
  }

  return slots
}

/** Check if a slot has any content */
export function isSlotFilled(slot: ShellMemberSlot): boolean {
  return Boolean(slot.name || slot.role || slot.bio || slot.photo)
}

/** Get filled slots only (for display mode) */
export function getFilledSlots(slots: ShellMemberSlot[]): ShellMemberSlot[] {
  return slots.filter(isSlotFilled)
}

/** Get entity slots */
export function getEntitySlots(slots: ShellMemberSlot[]): ShellMemberSlot[] {
  return slots.filter(s => s.slotType === 'entity')
}

/** Get engineer slots */
export function getEngineerSlots(slots: ShellMemberSlot[]): ShellMemberSlot[] {
  return slots.filter(s => s.slotType === 'engineer')
}

/** Update a specific slot */
export function updateMemberSlot(
  slots: ShellMemberSlot[],
  index: number,
  update: Partial<ShellMember>,
): ShellMemberSlot[] {
  return slots.map((slot, i) =>
    i === index ? { ...slot, ...update } : slot,
  )
}

/** Clear a specific slot (reset to empty) */
export function clearMemberSlot(
  slots: ShellMemberSlot[],
  index: number,
): ShellMemberSlot[] {
  return slots.map((slot, i) =>
    i === index
      ? { slotType: slot.slotType, slotIndex: slot.slotIndex }
      : slot,
  )
}

/** Convert member slots back to legacy shellMembers for backward compatibility */
export function slotsToShellMembers(slots: ShellMemberSlot[]): ShellMember[] {
  return slots
    .filter(isSlotFilled)
    .map(({ slotType: _st, slotIndex: _si, ...member }) => member)
}
