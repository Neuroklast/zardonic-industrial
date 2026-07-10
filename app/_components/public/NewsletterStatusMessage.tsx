'use client'

import { useLocale } from '@/contexts/LocaleContext'

interface NewsletterStatusMessageProps {
  variant: 'success' | 'error'
  titleKey: string
  messageKey?: string
  message?: string
}

export function NewsletterStatusMessage({
  variant,
  titleKey,
  messageKey,
  message,
}: NewsletterStatusMessageProps) {
  const { t } = useLocale()
  const borderClass = variant === 'success' ? 'border-border text-foreground' : 'border-destructive/50 text-destructive'
  const displayMessage = message ?? (messageKey ? t(messageKey) : '')

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-4 font-mono text-2xl uppercase tracking-widest text-foreground">{t(titleKey)}</h1>
      <p className={`border px-4 py-3 font-mono text-sm ${borderClass}`}>{displayMessage}</p>
      <p className="mt-6">
        <a
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {t('newsletter.backHome')}
        </a>
      </p>
    </div>
  )
}