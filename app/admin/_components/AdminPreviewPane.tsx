'use client'

import { useState, useRef, useCallback } from 'react'
import { ArrowSquareOut, ArrowsClockwise } from '@phosphor-icons/react'
import { broadcastAdminRefresh } from '@/lib/admin-draft-channel'

type PreviewMode = 'editor' | 'split'

interface AdminPreviewPaneProps {
  children: React.ReactNode
}

export function AdminPreviewPane({ children }: AdminPreviewPaneProps) {
  const [mode, setMode] = useState<PreviewMode>('split')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const refreshPreview = useCallback(() => {
    broadcastAdminRefresh()
    const iframe = iframeRef.current
    if (iframe) {
      const base = iframe.getAttribute('src') ?? '/?adminPreview=1'
      const url = new URL(base, window.location.origin)
      url.searchParams.set('_t', String(Date.now()))
      iframe.setAttribute('src', `${url.pathname}${url.search}`)
    }
  }, [])

  const openInNewTab = useCallback(() => {
    window.open('/?adminPreview=1', '_blank', 'noopener,noreferrer')
  }, [])

  return (
    <div className="space-y-3" data-admin-ui="true">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode('editor')}
          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
            mode === 'editor'
              ? 'border-red-600 bg-red-900/30 text-white'
              : 'border-zinc-700 text-zinc-400 hover:text-white'
          }`}
        >
          Editor only
        </button>
        <button
          type="button"
          onClick={() => setMode('split')}
          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
            mode === 'split'
              ? 'border-red-600 bg-red-900/30 text-white'
              : 'border-zinc-700 text-zinc-400 hover:text-white'
          }`}
        >
          Split preview
        </button>
        <button
          type="button"
          onClick={refreshPreview}
          aria-label="Refresh live preview"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowsClockwise size={14} aria-hidden="true" />
          Refresh
        </button>
        <button
          type="button"
          onClick={openInNewTab}
          aria-label="Open preview in new tab"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowSquareOut size={14} aria-hidden="true" />
          New tab
        </button>
      </div>

      <div className={mode === 'split' ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : ''}>
        <div className="min-w-0">{children}</div>
        {mode === 'split' && (
          <div className="min-w-0 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
            <div className="px-3 py-2 border-b border-zinc-800 text-xs text-zinc-500">
              Live preview — changes appear before Save
            </div>
            <iframe
              ref={iframeRef}
              title="Site live preview"
              src="/?adminPreview=1"
              className="w-full h-[min(80vh,900px)] bg-black"
            />
          </div>
        )}
      </div>
    </div>
  )
}