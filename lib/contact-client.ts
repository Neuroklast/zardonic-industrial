export interface ContactSubmitResult { success?: boolean; error?: string }

/** Visitors should see a successful submission, not an email provider status. */
export const CONTACT_SUBMISSION_SUCCESS_MESSAGE = 'Thank you! Your message has been submitted successfully.'

/** Stable client transport independent of build-specific Server Action IDs. */
export async function sendContactForm(formData: FormData): Promise<ContactSubmitResult> {
  const response = await fetch('/api/contact', {
    method: 'POST', body: formData, credentials: 'same-origin', cache: 'no-store',
  })
  const payload: unknown = await response.json().catch(() => null)
  const result = payload && typeof payload === 'object' ? payload as ContactSubmitResult : {}
  if (response.ok && result.success === true) return { success: true }
  return {
    error: typeof result.error === 'string' && result.error
      ? result.error : 'Failed to send message. Please try again later.',
  }
}
