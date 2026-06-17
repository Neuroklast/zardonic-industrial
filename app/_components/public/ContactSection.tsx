'use client'

import { useActionState } from 'react'
import { SectionWrapper } from './SectionWrapper'
import { submitContact } from '@/app/_actions/contact'

export function ContactSection() {
  const [state, formAction, pending] = useActionState(submitContact, null)

  return (
    <SectionWrapper id="contact" heading="Contact">
      <div className="max-w-xl">
        {state?.success ? (
          <p className="font-mono text-sm text-zinc-300 border border-zinc-700 px-4 py-3">
            Message sent. Thank you.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-zinc-500 mb-1 uppercase tracking-wider">
                  Name
                </label>
                <input
                  name="name"
                  required
                  className="w-full bg-transparent border border-zinc-700 hover:border-zinc-500 focus:border-zinc-400 focus:outline-none px-3 py-2 font-mono text-sm text-zinc-200 transition-colors"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-zinc-500 mb-1 uppercase tracking-wider">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-transparent border border-zinc-700 hover:border-zinc-500 focus:border-zinc-400 focus:outline-none px-3 py-2 font-mono text-sm text-zinc-200 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block font-mono text-xs text-zinc-500 mb-1 uppercase tracking-wider">
                Subject
              </label>
              <input
                name="subject"
                required
                className="w-full bg-transparent border border-zinc-700 hover:border-zinc-500 focus:border-zinc-400 focus:outline-none px-3 py-2 font-mono text-sm text-zinc-200 transition-colors"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-zinc-500 mb-1 uppercase tracking-wider">
                Message
              </label>
              <textarea
                name="message"
                required
                minLength={10}
                rows={5}
                className="w-full bg-transparent border border-zinc-700 hover:border-zinc-500 focus:border-zinc-400 focus:outline-none px-3 py-2 font-mono text-sm text-zinc-200 transition-colors resize-none"
              />
            </div>
            {state?.error && (
              <p className="font-mono text-xs text-red-400">{state.error}</p>
            )}
            <div>
              <button
                type="submit"
                disabled={pending}
                className="font-mono text-xs tracking-widest uppercase border border-zinc-600 hover:border-white text-zinc-400 hover:text-white px-6 py-2 transition-colors disabled:opacity-50"
              >
                {pending ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </SectionWrapper>
  )
}
