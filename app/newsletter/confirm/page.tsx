import type { Metadata } from 'next'
import { confirmNewsletter } from '@/app/_actions/newsletter'
import { LegalPageShell } from '@/app/_components/public/LegalPageShell'
import { NewsletterStatusMessage } from '@/app/_components/public/NewsletterStatusMessage'

export const metadata: Metadata = {
  title: 'Confirm Newsletter',
  robots: { index: false, follow: false },
}

interface ConfirmPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function NewsletterConfirmPage({ searchParams }: ConfirmPageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <LegalPageShell>
        <NewsletterStatusMessage
          variant="error"
          titleKey="newsletter.confirmFailedTitle"
          messageKey="newsletter.confirmMissingToken"
        />
      </LegalPageShell>
    )
  }

  const result = await confirmNewsletter(token)

  if (!result || result.error) {
    return (
      <LegalPageShell>
        <NewsletterStatusMessage
          variant="error"
          titleKey="newsletter.confirmFailedTitle"
          message={result?.error ?? undefined}
          messageKey="newsletter.confirmFailed"
        />
      </LegalPageShell>
    )
  }

  return (
    <LegalPageShell>
      <NewsletterStatusMessage
        variant="success"
        titleKey="newsletter.confirmSuccessTitle"
        messageKey="newsletter.confirmSuccess"
      />
    </LegalPageShell>
  )
}