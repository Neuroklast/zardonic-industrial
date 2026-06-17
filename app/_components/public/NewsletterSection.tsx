'use client'

import { useActionState } from 'react'
import { SectionWrapper } from './SectionWrapper'
import { subscribeNewsletter } from '@/app/_actions/newsletter'

interface NewsletterSectionProps {
  heading: string
  body: string
}

export function NewsletterSection({ heading, body }: NewsletterSectionProps) {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, null)

  return (
    <SectionWrapper id="newsletter" heading={heading}>
      <div className="max-w-xl">
        <p className="font-mono text-sm text-zinc-400 mb-6">{body}</p>

        {state?.success ? (
          <p className="font-mono text-sm text-zinc-300 border border-zinc-700 px-4 py-3">
            You&apos;re subscribed. Thank you.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex gap-2">
              <input
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                className="flex-1 bg-transparent border border-zinc-700 hover:border-zinc-500 focus:border-zinc-400 focus:outline-none px-3 py-2 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 transition-colors"
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={pending}
                className="font-mono text-xs tracking-widest uppercase border border-zinc-600 hover:border-white text-zinc-400 hover:text-white px-4 py-2 transition-colors disabled:opacity-50"
              >
                {pending ? '…' : 'Subscribe'}
              </button>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                name="consent_given"
                type="checkbox"
                value="true"
                required
                className="mt-0.5 accent-zinc-400"
              />
              <span className="font-mono text-xs text-zinc-600">
                I agree to receive emails and accept the privacy policy.
              </span>
            </label>
            {state?.error && (
              <p className="font-mono text-xs text-red-400">{state.error}</p>
            )}
          </form>
        )}
      </div>
    </SectionWrapper>
  )
}
