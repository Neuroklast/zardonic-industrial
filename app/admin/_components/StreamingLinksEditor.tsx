'use client'

import { useState } from 'react'

export interface StreamingLink {
  platform: string
  url: string
}

interface StreamingLinksEditorProps {
  /** JSON-encoded initial value from the hidden input. */
  initialJson?: string
}

const PLATFORM_SUGGESTIONS = [
  'Spotify', 'Apple Music', 'Bandcamp', 'Beatport', 'SoundCloud',
  'YouTube', 'Amazon Music', 'Deezer', 'Tidal', 'iTunes',
]

export function StreamingLinksEditor({ initialJson = '[]' }: StreamingLinksEditorProps) {
  const [links, setLinks] = useState<StreamingLink[]>(() => {
    try {
      const parsed = JSON.parse(initialJson)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  function addLink() {
    setLinks((prev) => [...prev, { platform: '', url: '' }])
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  function updateLink(index: number, field: keyof StreamingLink, value: string) {
    setLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    )
  }

  const validLinks = links.filter((l) => l.platform.trim() && l.url.trim())

  return (
    <div className="space-y-3">
      {links.map((link, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 min-w-0">
            <input
              list={`platform-suggestions-${i}`}
              value={link.platform}
              onChange={(e) => updateLink(i, 'platform', e.target.value)}
              placeholder="Platform (e.g. Spotify)"
              className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
              aria-label={`Streaming platform ${i + 1}`}
            />
            <datalist id={`platform-suggestions-${i}`}>
              {PLATFORM_SUGGESTIONS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div className="flex-[2] min-w-0">
            <input
              type="url"
              value={link.url}
              onChange={(e) => updateLink(i, 'url', e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
              aria-label={`URL for streaming platform ${i + 1}`}
            />
          </div>
          <button
            type="button"
            onClick={() => removeLink(i)}
            className="shrink-0 px-2 py-2 text-zinc-500 hover:text-red-400 transition-colors"
            aria-label={`Remove streaming link ${i + 1}`}
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addLink}
        className="text-sm text-zinc-400 hover:text-white transition-colors border border-dashed border-zinc-700 hover:border-zinc-500 rounded px-3 py-1.5 w-full"
      >
        + Add streaming link
      </button>

      {/* Hidden input serialises the links for form submission */}
      <input
        type="hidden"
        name="streaming_links"
        value={JSON.stringify(validLinks)}
      />
    </div>
  )
}
