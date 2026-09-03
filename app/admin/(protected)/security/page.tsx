import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { ChangePasswordForm } from './ChangePasswordForm'

export default function SecurityAdminPage() {
  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Security"
        description="Change the password used to sign in to the admin. Requires your current password. If your account has two-factor authentication (MFA) enabled, the change must be verified from a signed-in session."
      />
      <ChangePasswordForm />
    </div>
  )
}
