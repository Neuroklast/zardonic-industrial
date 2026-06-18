import { describe, expect, it } from 'vitest'
import { formatAdminActionError } from '@/app/admin/_actions/auth'

describe('formatAdminActionError', () => {
  it('returns explicit error messages for thrown errors', async () => {
    await expect(formatAdminActionError(new Error('Your admin session has expired. Please sign in again.'))).resolves.toBe(
      'Your admin session has expired. Please sign in again.',
    )
  })

  it('falls back to the provided message for unknown errors', async () => {
    await expect(formatAdminActionError(null, 'Unable to save site configuration.')).resolves.toBe(
      'Unable to save site configuration.',
    )
  })
})
