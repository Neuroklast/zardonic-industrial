import { describe, expect, it } from 'vitest'
import {
  parseMobileVideoMode,
  resolveActiveBackgroundVideoUrl,
} from '@/lib/background-config'

describe('background-config', () => {
  it('parseMobileVideoMode defaults to same', () => {
    expect(parseMobileVideoMode(undefined)).toBe('same')
    expect(parseMobileVideoMode('invalid')).toBe('same')
    expect(parseMobileVideoMode('off')).toBe('off')
    expect(parseMobileVideoMode('separate')).toBe('separate')
  })

  it('resolveActiveBackgroundVideoUrl uses desktop on desktop', () => {
    expect(
      resolveActiveBackgroundVideoUrl('https://desktop.mp4', 'https://mobile.mp4', 'separate', false),
    ).toBe('https://desktop.mp4')
  })

  it('resolveActiveBackgroundVideoUrl hides video when mobile mode is off', () => {
    expect(
      resolveActiveBackgroundVideoUrl('https://desktop.mp4', undefined, 'off', true),
    ).toBeUndefined()
  })

  it('resolveActiveBackgroundVideoUrl uses mobile video when separate', () => {
    expect(
      resolveActiveBackgroundVideoUrl('https://desktop.mp4', 'https://mobile.mp4', 'separate', true),
    ).toBe('https://mobile.mp4')
  })

  it('resolveActiveBackgroundVideoUrl falls back to desktop when separate but no mobile url', () => {
    expect(
      resolveActiveBackgroundVideoUrl('https://desktop.mp4', undefined, 'separate', true),
    ).toBe('https://desktop.mp4')
  })

  it('resolveActiveBackgroundVideoUrl uses desktop on mobile when mode is same', () => {
    expect(
      resolveActiveBackgroundVideoUrl('https://desktop.mp4', 'https://mobile.mp4', 'same', true),
    ).toBe('https://desktop.mp4')
  })
})