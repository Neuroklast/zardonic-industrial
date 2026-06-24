'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import { broadcastAdminDraft } from '@/lib/admin-draft-channel'
import { parseLegalConfig, type LegalConfig } from '@/lib/legal-content'

interface FieldDef {
  key: keyof LegalConfig
  label: string
  type?: 'text' | 'textarea' | 'email' | 'tel'
  placeholder?: string
  helper?: string
}

const OPERATOR_FIELDS: FieldDef[] = [
  { key: 'operatorName', label: 'Operator Name', placeholder: 'Full legal name or company' },
  { key: 'careOf', label: 'c/o (optional)', placeholder: 'c/o Organisation GmbH' },
  { key: 'street', label: 'Street & Number', placeholder: 'Musterstraße 1' },
  { key: 'zipCity', label: 'ZIP + City', placeholder: '12345 Berlin' },
  { key: 'country', label: 'Country', placeholder: 'Germany' },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+49 123 456789' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'info@example.com' },
  { key: 'vatId', label: 'VAT ID (optional)', placeholder: 'DE123456789' },
]

const RESPONSIBLE_FIELDS: FieldDef[] = [
  {
    key: 'responsibleName',
    label: 'Responsible Person Name',
    placeholder: 'Defaults to operator name if empty',
  },
  {
    key: 'responsibleAddress',
    label: 'Responsible Person Address',
    type: 'textarea',
    placeholder: 'Defaults to operator address if empty',
  },
]

interface LegalConfigEditorProps {
  currentValue: Record<string, unknown>
}

export function LegalConfigEditor({ currentValue }: LegalConfigEditorProps) {
  const router = useRouter()
  const parsed = useMemo(() => parseLegalConfig(currentValue), [currentValue])

  const [values, setValues] = useState<LegalConfig>(parsed)
  const [showExpert, setShowExpert] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function updateField<K extends keyof LegalConfig>(key: K, value: LegalConfig[K]) {
    const next = { ...values, [key]: value }
    setValues(next)
    broadcastAdminDraft('legal', next as unknown as Record<string, unknown>)
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    const fd = new FormData()
    fd.set('key', 'legal')
    fd.set('value', JSON.stringify(values))
    const result = await updateSiteConfig(fd)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('saved')
      router.refresh()
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  function renderField(field: FieldDef) {
    const value = values[field.key] ?? ''
    const inputClass =
      'w-full font-mono text-sm bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-zinc-300 focus:outline-none focus:border-zinc-600 min-h-[44px]'

    return (
      <div key={field.key} className="space-y-1">
        <label htmlFor={`legal-${field.key}`} className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">
          {field.label}
        </label>
        {field.type === 'textarea' ? (
          <textarea
            id={`legal-${field.key}`}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => updateField(field.key, e.target.value)}
            rows={4}
            placeholder={field.placeholder}
            className={`${inputClass} resize-y min-h-[88px]`}
          />
        ) : (
          <input
            id={`legal-${field.key}`}
            type={field.type ?? 'text'}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
          />
        )}
        {field.helper && <p className="text-xs text-zinc-500">{field.helper}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24" data-admin-ui="true">
      <section className="border border-zinc-800 rounded p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Operator Identity</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            These fields are injected into the Legal Notice and Privacy Policy. Update your address here without editing the full legal text.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OPERATOR_FIELDS.map(renderField)}
        </div>
      </section>

      <section className="border border-zinc-800 rounded p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Editorial Responsibility</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Required under § 18 (2) MStV for editorial content.</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {RESPONSIBLE_FIELDS.map(renderField)}
        </div>
      </section>

      <section className="border border-zinc-800 rounded p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Privacy Policy</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Leave empty to use the built-in GDPR-compliant template. Enter custom text to override the entire policy.
          </p>
        </div>
        <textarea
          id="legal-privacyPolicyCustom"
          value={values.privacyPolicyCustom ?? ''}
          onChange={(e) => updateField('privacyPolicyCustom', e.target.value)}
          rows={12}
          placeholder="Optional: full custom privacy policy text…"
          className="w-full font-mono text-sm bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-zinc-300 focus:outline-none focus:border-zinc-600 resize-y min-h-[200px]"
        />
      </section>

      <section className="border border-zinc-800 rounded p-4 sm:p-6 space-y-4">
        <button
          type="button"
          onClick={() => setShowExpert((v) => !v)}
          className="text-xs text-zinc-400 hover:text-zinc-200 uppercase tracking-widest font-semibold"
          aria-expanded={showExpert}
        >
          {showExpert ? '− Hide' : '+ Show'} expert: custom legal notice override
        </button>
        {showExpert && (
          <textarea
            id="legal-legalNoticeCustom"
            value={values.legalNoticeCustom ?? ''}
            onChange={(e) => updateField('legalNoticeCustom', e.target.value)}
            rows={10}
            placeholder="Optional: full custom legal notice text (overrides structured fields)…"
            className="w-full font-mono text-sm bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-zinc-300 focus:outline-none focus:border-zinc-600 resize-y min-h-[160px]"
          />
        )}
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 px-4 py-3 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:border-0 sm:backdrop-blur-none">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={status === 'saving'}
            className="px-4 py-2.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {status === 'saving' ? 'Saving…' : 'Save Legal Settings'}
          </button>
          {status === 'saved' && <span className="text-xs text-green-400">Saved</span>}
          {status === 'error' && <span className="text-xs text-red-400">{errorMsg ?? 'Error'}</span>}
        </div>
      </div>
    </div>
  )
}