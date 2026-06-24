import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { getApiSecretsStatus } from '@/lib/api-secrets'
import { isSecretsEncryptionConfigured } from '@/lib/secrets-encryption'
import { ApiKeysEditor } from './ApiKeysEditor'

export default async function ApiKeysAdminPage() {
  const [status, encryptionReady] = await Promise.all([
    getApiSecretsStatus(),
    Promise.resolve(isSecretsEncryptionConfigured()),
  ])

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="API Keys"
        description="Manage third-party integration credentials. Values are encrypted in Supabase and never exposed to the public site."
      />
      <ApiKeysEditor initialStatus={status} encryptionReady={encryptionReady} />
    </div>
  )
}