import type { Metadata } from 'next'
import { LegalPageShell } from '@/app/_components/public/LegalPageShell'
import { NewsletterUnsubscribeForm } from '@/app/_components/public/NewsletterUnsubscribeForm'
import { NewsletterStatusMessage } from '@/app/_components/public/NewsletterStatusMessage'

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
}

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function NewsletterUnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <LegalPageShell>
        <NewsletterStatusMessage
          variant="error"
          titleKey="newsletter.unsubscribeTitle"
          messageKey="newsletter.unsubscribeInvalid"
        />
      </LegalPageShell>
    )
  }

  return (
    <LegalPageShell>
      <div className="mx-auto max-w-lg px-4 py-16">
        <NewsletterUnsubscribeForm token={token} />
      </div>
    </LegalPageShell>
  )
}