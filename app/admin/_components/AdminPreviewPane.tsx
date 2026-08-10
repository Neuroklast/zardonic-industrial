'use client'

import { useState, useRef, useCallback } from 'react'
import { ArrowSquareOut, ArrowsClockwise, DeviceMobile, Desktop } from '@phosphor-icons/react'
import { broadcastAdminRefresh } from '@/lib/admin-draft-channel'

type PreviewMode = 'editor' | 'split'
/** Constrains the preview iframe width so CSS media queries (and hero mobile width) apply. */
type PreviewDevice = 'desktop' | 'mobile'

/** ~iPhone 14/15 logical width — below site md (768px) so mobile styles apply. */
const MOBILE_PREVIEW_WIDTH_PX = 390

interface AdminPreviewPaneProps {
  children: React.ReactNode
}

export function AdminPreviewPane({ children }: AdminPreviewPaneProps) {
  const [mode, setMode] = useState<PreviewMode>('split')
  const [device, setDevice] = useState<PreviewDevice>('desktop')
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

  const isMobile = device === 'mobile'

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
          <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
              <span className="text-xs text-zinc-500">
                Live preview — changes appear before Save
                {isMobile ? (
                  <span className="ml-1.5 font-mono text-zinc-600">· {MOBILE_PREVIEW_WIDTH_PX}px</span>
                ) : null}
              </span>
              <div
                className="inline-flex rounded border border-zinc-700 p-0.5"
                role="group"
                aria-label="Preview device width"
              >
                <button
                  type="button"
                  onClick={() => setDevice('desktop')}
                  aria-pressed={device === 'desktop'}
                  className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors ${
                    device === 'desktop'
                      ? 'bg-red-900/40 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Desktop size={14} aria-hidden="true" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('mobile')}
                  aria-pressed={device === 'mobile'}
                  className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors ${
                    device === 'mobile'
                      ? 'bg-red-900/40 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <DeviceMobile size={14} aria-hidden="true" />
                  Mobile
                </button>
              </div>
            </div>
            {/*
              Single iframe: only the width shell changes so draft listener state
              survives Desktop ↔ Mobile. Iframe width drives media queries inside.
            */}
            <div
              className={
                isMobile
                  ? 'flex justify-center overflow-auto bg-zinc-900/50 p-3'
                  : 'bg-black'
              }
            >
              <div
                className={
                  isMobile
                    ? 'shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-black shadow-lg'
                    : 'w-full'
                }
                style={isMobile ? { width: MOBILE_PREVIEW_WIDTH_PX } : undefined}
              >
                <iframe
                  ref={iframeRef}
                  title={isMobile ? 'Site live preview (mobile)' : 'Site live preview'}
                  src="/?adminPreview=1"
                  className="block w-full bg-black"
                  style={{
                    width: isMobile ? MOBILE_PREVIEW_WIDTH_PX : '100%',
                    height: 'min(80vh, 900px)',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
