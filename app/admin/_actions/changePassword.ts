'use server'

import { createActionClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/app/admin/_actions/auth'

/**
 * Changes the password of the currently authenticated admin user.
 * Verifies the current password first (lenient on TOTP/MFA errors — the
 * admin session already passed any MFA challenge, so an mfa-required
 * error does not block the update).
 */
export async function changeAdminPassword(formData: FormData) {
  await requireAdmin()

  const current = String(formData.get('current') ?? '').trim()
  const next = String(formData.get('next') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!current) {
    return { error: 'Enter your current password.' }
  }
  if (next.length < 8) {
    return { error: 'New password must be at least 8 characters.' }
  }
  if (next === current) {
    return { error: 'New password must be different from your current password.' }
  }
  if (next !== confirm) {
    return { error: 'New passwords do not match.' }
  }

  const supabase = await createActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Your admin session has expired. Please sign in again.' }
  }

  const identifier = user.email || user.phone || ''

  if (identifier.includes('@')) {
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: current,
    })

    if (verifyError) {
      const message = verifyError.message || ''
      const isMfa = /mfa|totp|otp/i.test(message)
      if (!isMfa) {
        return { error: 'Current password is incorrect.' }
      }
    }
  }

  const { error } = await supabase.auth.updateUser({ password: next })

  if (error) {
    return { error: error.message || 'Unable to change the password. Please try again.' }
  }

  revalidatePath('/admin/security')
  return { success: true as const }
}
