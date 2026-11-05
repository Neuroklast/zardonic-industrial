'use client'

import { useState, type FormEvent } from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import { resolveSectionHeading } from '@/lib/section-display'
import { SectionWrapper, SectionHeading, SectionIntro } from './SectionWrapper'
import { sendContactForm, type ContactSubmitResult } from '@/lib/contact-client'

const fieldClass =
  'min-h-[44px] w-full border border-border bg-transparent px-3 py-2 font-mono text-sm text-foreground transition-colors hover:border-primary/40 focus:border-primary/60 focus:outline-none'

interface ContactSectionProps {
  heading?: string
  intro?: string
  privacyPolicyUrl?: string
}

export function ContactSection({
  heading,
  intro,
  privacyPolicyUrl = '/privacy-policy',
}: ContactSectionProps) {
  const { t } = useLocale()
  const [state, setState] = useState<ContactSubmitResult | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const formData = new FormData(event.currentTarget)
    setPending(true)
    setState(null)
    try {
      setState(await sendContactForm(formData))
    } catch {
      setState({ error: 'Failed to send message. Please try again later.' })
    } finally {
      setPending(false)
    }
  }
  const title = resolveSectionHeading(heading, 'contact', t)

  return (
    <SectionWrapper id="contact" data-theme-color="foreground card border input">
      <SectionHeading sectionId="contact" dataText={title}>{title}</SectionHeading>
      <SectionIntro sectionId="contact">{intro}</SectionIntro>

      {state?.success ? (
        <p className="border border-border px-4 py-3 font-mono text-sm text-foreground">
          Message accepted for delivery. Please note that inbox delivery is not guaranteed.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          {/* Honeypot — hidden from users; bots that fill it are silently accepted */}
          <input
            type="text"
            name="_hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {t('contact.nameLabel')}
              </label>
              <input id="contact-name" name="name" required maxLength={100} className={fieldClass} autoComplete="name" placeholder={t('contact.namePlaceholder')} />
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {t('contact.emailLabel')}
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                maxLength={254}
                className={fieldClass}
                autoComplete="email"
                placeholder={t('contact.emailPlaceholder')}
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-subject" className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {t('contact.subjectLabel')}
            </label>
            <input id="contact-subject" name="subject" required maxLength={200} className={fieldClass} placeholder={t('contact.subjectPlaceholder')} />
          </div>
          <div>
            <label htmlFor="contact-message" className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {t('contact.messageLabel')}
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              className={`${fieldClass} min-h-[8rem] resize-none`}
              placeholder={t('contact.messagePlaceholder')}
            />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {t('contact.description')}{' '}
            <a
              href={privacyPolicyUrl}
              className="text-foreground underline underline-offset-2 transition-colors hover:text-primary"
            >
              {t('footer.privacy')}
            </a>
            .
          </p>
          {state?.error ? (
            <p className="font-mono text-xs text-destructive">{state.error}</p>
          ) : null}
          <div>
            <button
              type="submit"
              disabled={pending}
              className="min-h-[44px] border border-border px-6 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              {pending ? t('contact.sending') : t('contact.send')}
            </button>
          </div>
        </form>
      )}
    </SectionWrapper>
  )
}