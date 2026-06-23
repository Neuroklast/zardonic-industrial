'use client'

interface ReleaseTracklistFieldProps {
  initialTracks: unknown
}

function formatTracksForTextarea(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return '[]'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return '[]'
  }
}

export function ReleaseTracklistField({ initialTracks }: ReleaseTracklistFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="tracks" className="block text-sm text-zinc-300">
        Tracklist (JSON)
      </label>
      <textarea
        id="tracks"
        name="tracks"
        rows={8}
        defaultValue={formatTracksForTextarea(initialTracks)}
        placeholder={'[\n  { "title": "Track 1", "artist": "Zardonic", "duration": "3:42" }\n]'}
        className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-zinc-500 resize-y"
      />
      <p className="text-xs text-zinc-500">
        Shown in the public release modal. Each track supports title, optional artist, duration, and featuredArtists.
      </p>
    </div>
  )
}