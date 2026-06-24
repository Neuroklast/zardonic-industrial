import { describe, expect, it } from 'vitest'
import { isBlockedHost, isBlockedResolvedIp } from '@/lib/ssrf-guard'

describe('ssrf-guard', () => {
  it('blocks localhost and private host patterns', () => {
    expect(isBlockedHost('localhost')).toBe(true)
    expect(isBlockedHost('127.0.0.1')).toBe(true)
    expect(isBlockedHost('10.0.0.1')).toBe(true)
    expect(isBlockedHost('metadata.google.internal')).toBe(true)
  })

  it('allows public hostnames', () => {
    expect(isBlockedHost('cdn.example.com')).toBe(false)
    expect(isBlockedHost('drive.google.com')).toBe(false)
  })

  it('blocks private resolved IPs', () => {
    expect(isBlockedResolvedIp('127.0.0.1')).toBe(true)
    expect(isBlockedResolvedIp('192.168.1.1')).toBe(true)
    expect(isBlockedResolvedIp('8.8.8.8')).toBe(false)
  })
})