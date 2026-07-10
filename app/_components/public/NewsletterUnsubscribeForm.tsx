'use client'

import { useActionState } from 'react'
import { unsubscribeNewsletter } from '@/app/_actions/newsletter'
import { useLocale } from '@/contexts/LocaleContext'

interface NewsletterUnsubscribeFormProps {
  token: string
}

export function NewsletterUnsubscribeForm({ token }: NewsletterUnsubscribeFormProps) {
  const { t } = useLocale()
  const [state, formAction, pending] = useActionState(unsubscribeNewsletter, null)

  if (state?.success) {
    return (
      <div>
        <h1 className="mb-6 font-mono text-2xl uppercase tracking-widest text-foreground">
          {t('newsletter.unsubscribeTitle')}
        </h1>
        <p className="border border-border px-4 py-3 font-mono text-sm text-foreground">
          {t('newsletter.unsubscribeSuccess')}
        </p>
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

  return (
    <div>
      <h1 className="mb-6 font-mono text-2xl uppercase tracking-widest text-foreground">
        {t('newsletter.unsubscribeTitle')}
      </h1>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <p className="font-mono text-sm text-muted-foreground">{t('newsletter.unsubscribePrompt')}</p>
        {state?.error ? (
          <p className="font-mono text-xs text-destructive">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="min-h-[44px] w-fit border border-border px-6 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
        >
          {pending ? '…' : t('newsletter.unsubscribeConfirm')}
        </button>
      </form>
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