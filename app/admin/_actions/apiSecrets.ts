'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import {
  API_SECRET_FIELDS,
  saveApiSecrets,
  type ApiSecretKey,
} from '@/lib/api-secrets'
import { isSecretsEncryptionConfigured } from '@/lib/secrets-encryption'
import { revalidatePath } from 'next/cache'

export async function updateApiSecrets(formData: FormData) {
  if (!isSecretsEncryptionConfigured()) {
    return {
      error:
        'SECRETS_ENCRYPTION_KEY is not configured on the server. Set a 64-character hex key in Vercel env vars.',
    }
  }

  const values: Partial<Record<ApiSecretKey, string>> = {}
  const clearKeys: ApiSecretKey[] = []

  for (const field of API_SECRET_FIELDS) {
    const rawValue = formData.get(field.key)
    if (typeof rawValue === 'string' && rawValue.trim()) {
      values[field.key] = rawValue
    }

    const clearFlag = formData.get(`clear_${field.key}`)
    if (clearFlag === '1' || clearFlag === 'true') {
      clearKeys.push(field.key)
    }
  }

  return runAdminAction(async () => {
    await saveApiSecrets({ values, clearKeys })
    revalidatePath('/admin/api-keys')
    revalidatePath('/admin/health')
    return { success: true as const }
  }, 'Unable to save API keys.')
}