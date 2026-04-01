/**
 * SiteSettings — edit site name, logo, social links, footer, custom CSS.
 */

import { useState, useEffect } from 'react'
import { CmsTopBar } from '../components/CmsTopBar'
import { AutoSaveIndicator } from '../components/AutoSaveIndicator'
import { useSiteConfig, useSiteConfigMutation } from '../hooks/useCmsApi'
import { useAutoSave } from '../hooks/useAutoSave'
import { toast } from 'sonner'

interface SiteConfigData {
  siteName?: string
  tagline?: string
  logoUrl?: string
  faviconUrl?: string
  footerText?: string
  analyticsId?: string
  customCss?: string
  socialLinks?: Record<string, string>
}

export function SiteSettings() {
  const { data: config, isLoading } = useSiteConfig()
  const mutation = useSiteConfigMutation()
  const [form, setForm] = useState<SiteConfigData>({})

  const configData = config as SiteConfigData | undefined

  useEffect(() => {
    if (configData) setForm(configData)
  }, [configData])

  async function save(data: SiteConfigData) {
    try {
      await mutation.mutateAsync(data as Record<string, unknown>)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern')
      throw err
    }
  }

  const { status } = useAutoSave({ key: 'site-settings', data: form, onSave: save })

  function update(field: keyof SiteConfigData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function updateSocial(key: string, value: string) {
    setForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks ?? {}), [key]: value } }))
  }

  const socialKeys = ['spotify', 'youtube', 'instagram', 'twitter', 'facebook', 'bandcamp', 'soundcloud']

  if (isLoading) return <div className="p-6 text-zinc-500 font-mono text-sm">Lädt…</div>

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar
        title="Site Settings"
        breadcrumbs={['CMS', 'Settings']}
        actions={<AutoSaveIndicator status={status} />}
      />
      <div className="p-6 max-w-3xl space-y-8">

        {/* General */}
        <section>
          <h2 className="text-xs font-mono text-zinc-500 uppercase mb-4">// General</h2>
          <div className="space-y-4">
            <Field label="Site Name" value={form.siteName ?? ''} onChange={v => update('siteName', v)} />
            <Field label="Tagline" value={form.tagline ?? ''} onChange={v => update('tagline', v)} />
            <Field label="Logo URL" value={form.logoUrl ?? ''} onChange={v => update('logoUrl', v)} type="url" />
            <Field label="Favicon URL" value={form.faviconUrl ?? ''} onChange={v => update('faviconUrl', v)} type="url" />
            <Field label="Footer Text" value={form.footerText ?? ''} onChange={v => update('footerText', v)} />
            <Field label="Analytics ID" value={form.analyticsId ?? ''} onChange={v => update('analyticsId', v)} />
          </div>
        </section>

        {/* Social Links */}
        <section>
          <h2 className="text-xs font-mono text-zinc-500 uppercase mb-4">// Social Links</h2>
          <div className="space-y-3">
            {socialKeys.map(key => (
              <Field
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                value={(form.socialLinks ?? {})[key] ?? ''}
                onChange={v => updateSocial(key, v)}
                type="url"
              />
            ))}
          </div>
        </section>

        {/* Custom CSS */}
        <section>
          <h2 className="text-xs font-mono text-zinc-500 uppercase mb-4">// Custom CSS</h2>
          <textarea
            value={form.customCss ?? ''}
            onChange={e => update('customCss', e.target.value)}
            rows={10}
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 font-mono text-xs p-3 focus:outline-none focus:border-red-600 resize-y"
            placeholder="/* Custom CSS */"
            spellCheck={false}
          />
        </section>

        <button
          onClick={() => {
            save(form).then(() => toast.success('Gespeichert!')).catch((err: unknown) => {
              toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern')
            })
          }}
          disabled={mutation.isPending}
          className="px-6 py-2 bg-red-600 text-white font-mono text-sm hover:bg-red-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Speichert…' : 'SPEICHERN'}
        </button>
      </div>
    </div>
  )
}

// Simple text input field
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-mono text-zinc-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600"
      />
    </div>
  )
}
