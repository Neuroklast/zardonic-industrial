'use server'

import { requireAdmin } from '@/app/admin/_actions/auth'
import { createActionClient } from '@/lib/supabaseServer'

type EnrollmentResult =
  | { success: true; factorId: string; qrCode: string; secret: string }
  | { success: false; error: string }

type VerificationResult = { success: true } | { success: false; error: string }

/** Allow enrollment only for a logged-in administrator. Never log QR codes or TOTP secrets. */
export async function beginAdminMfaEnrollment(): Promise<EnrollmentResult> {
  try {
    await requireAdmin()
    const supabase = await createActionClient()
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (factorsError) return { success: false, error: 'Could not check existing MFA factors.' }
    if (factors?.totp?.length) {
      return { success: false, error: 'A TOTP factor is already enrolled. Verify it below.' }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'NEUROKLAST Admin',
    })
    if (error || !data?.totp?.qr_code || !data.totp.secret) {
      return { success: false, error: 'Authenticator setup failed. Please try again.' }
    }
    return {
      success: true, factorId: data.id,
      qrCode: data.totp.qr_code, secret: data.totp.secret,
    }
  } catch {
    return { success: false, error: 'Admin session expired or MFA service unavailable.' }
  }
}

/** Supabase verifies the factor is owned by the current user and promotes this session to AAL2. */
export async function verifyAdminMfa(factorId: string, code: string): Promise<VerificationResult> {
  try {
    await requireAdmin()
    if (!/^[0-9a-f-]{36}$/i.test(factorId) || !/^\d{6}$/.test(code.trim())) {
      return { success: false, error: 'Enter the six-digit code from your authenticator.' }
    }
    const supabase = await createActionClient()
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    })
    if (error || !data) return { success: false, error: 'Incorrect or expired code.' }
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (assuranceError || assurance?.currentLevel !== 'aal2') {
      return { success: false, error: 'Two-factor verification did not complete.' }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Admin session expired or verification unavailable.' }
  }
}
