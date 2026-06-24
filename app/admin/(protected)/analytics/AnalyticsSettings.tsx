'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import { parseAnalyticsConfig, type AnalyticsConfig } from '@/lib/analytics-config'

interface AnalyticsSettingsProps {
  initialConfig: Record<string, unknown>
}

export function AnalyticsSettings({ initialConfig }: AnalyticsSettingsProps) {
  const router = useRouter()
  const [config, setConfig] = useState<AnalyticsConfig>(() => parseAnalyticsConfig(initialConfig))
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function save(next: AnalyticsConfig) {
    setStatus('saving')
    setErrorMsg(null)
    const fd = new FormData()
    fd.set('key', 'analytics')
    fd.set('value', JSON.stringify(next))
    const result = await updateSiteConfig(fd)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
      return
    }
    setConfig(next)
    setStatus('saved')
    router.refresh()
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-300">Tracking Settings</h2>
        {status === 'saved' && <span className="text-xs text-green-400">Saved</span>}
        {status === 'error' && <span className="text-xs text-red-400">{errorMsg ?? 'Error'}</span>}
        {status === 'saving' && <span className="text-xs text-zinc-500">Saving…</span>}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-white">Enable Analytics</p>
            <p className="text-xs text-zinc-400 mt-0.5">Disable to stop all client-side tracking.</p>
          </div>
          <button
            type="button"
            disabled={status === 'saving'}
            onClick={() => save({ ...config, enabled: !config.enabled })}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${config.enabled ? 'bg-red-600' : 'bg-zinc-700'}`}
            role="switch"
            aria-checked={config.enabled}
            aria-label="Toggle analytics"
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${config.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {config.enabled && (
          <>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-white">Track Page Views</p>
                <p className="text-xs text-zinc-400 mt-0.5">Record each page navigation event.</p>
              </div>
              <button
                type="button"
                disabled={status === 'saving'}
                onClick={() => save({ ...config, trackPageViews: !config.trackPageViews })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${config.trackPageViews ? 'bg-red-600' : 'bg-zinc-700'}`}
                role="switch"
                aria-checked={config.trackPageViews}
                aria-label="Toggle page view tracking"
              >
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${config.trackPageViews ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-white">Track Events</p>
                <p className="text-xs text-zinc-400 mt-0.5">Record section views and button clicks.</p>
              </div>
              <button
                type="button"
                disabled={status === 'saving'}
                onClick={() => save({ ...config, trackEvents: !config.trackEvents })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${config.trackEvents ? 'bg-red-600' : 'bg-zinc-700'}`}
                role="switch"
                aria-checked={config.trackEvents}
                aria-label="Toggle event tracking"
              >
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${config.trackEvents ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}