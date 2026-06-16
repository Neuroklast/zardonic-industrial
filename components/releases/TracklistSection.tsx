import { ArrowCounterClockwise, ArrowsClockwise, Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Track = { title: string; duration?: string; artist?: string }
type NewTrack = { title: string; duration: string; artist: string }

interface TracklistSectionProps {
  tracks: Track[]
  setTracks: (tracks: Track[]) => void
  tracksHistory: Track[][]
  newTrack: NewTrack
  setNewTrack: (t: NewTrack) => void
  releaseId?: string
  isSyncingTracklist: boolean
  isSaving: boolean
  onTracklistSync: () => void
  onUndoTracklist: () => void
}

export function TracklistSection({
  tracks,
  setTracks,
  tracksHistory,
  newTrack,
  setNewTrack,
  releaseId,
  isSyncingTracklist,
  isSaving,
  onTracklistSync,
  onUndoTracklist,
}: TracklistSectionProps) {
  const addTrack = () => {
    if (newTrack.title.trim()) {
      setTracks([
        ...tracks,
        {
          title: newTrack.title.trim(),
          duration: newTrack.duration || undefined,
          artist: newTrack.artist.trim() || undefined,
        },
      ])
      setNewTrack({ title: '', duration: '', artist: '' })
    }
  }

  const removeTrack = (index: number) => {
    setTracks(tracks.filter((_, i) => i !== index))
  }

  return (
    <div className="border-t border-border pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Track List (optional)</h4>
        {releaseId && (
          <div className="flex items-center gap-1.5">
            {tracksHistory.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onUndoTracklist}
                disabled={isSyncingTracklist || isSaving}
                className="border-primary/30 hover:bg-primary/10 text-xs gap-1.5"
                title="Undo last tracklist sync"
                aria-label="Undo tracklist sync"
              >
                <ArrowCounterClockwise size={14} />
                Undo
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTracklistSync}
              disabled={isSyncingTracklist || isSaving}
              className="border-primary/30 hover:bg-primary/10 text-xs gap-1.5"
              title="Sync tracklist from MusicBrainz"
            >
              <ArrowsClockwise size={14} className={isSyncingTracklist ? 'animate-spin' : ''} />
              {isSyncingTracklist ? 'Syncing…' : 'Sync Tracklist'}
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {tracks.map((track, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              value={track.title}
              onChange={e => setTracks(tracks.map((t, i) => (i === index ? { ...t, title: e.target.value } : t)))}
              className="flex-1 bg-secondary border-input text-sm"
              placeholder="Track title"
            />
            <Input
              value={track.artist || ''}
              onChange={e => setTracks(tracks.map((t, i) => (i === index ? { ...t, artist: e.target.value || undefined } : t)))}
              className="w-28 bg-secondary border-input text-sm"
              placeholder="Artist"
              title="Artist name for this track (optional)"
            />
            <Input
              value={track.duration || ''}
              onChange={e => setTracks(tracks.map((t, i) => (i === index ? { ...t, duration: e.target.value || undefined } : t)))}
              className="w-20 bg-secondary border-input text-sm text-center"
              placeholder="4:23"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeTrack(index)}>
              <X size={16} />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            value={newTrack.title}
            onChange={e => setNewTrack({ ...newTrack, title: e.target.value })}
            placeholder="Track title"
            className="flex-1 bg-secondary border-input"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTrack()
              }
            }}
          />
          <Input
            value={newTrack.artist}
            onChange={e => setNewTrack({ ...newTrack, artist: e.target.value })}
            placeholder="Artist"
            className="w-28 bg-secondary border-input"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTrack()
              }
            }}
            title="Artist name for this track (optional)"
          />
          <Input
            value={newTrack.duration}
            onChange={e => setNewTrack({ ...newTrack, duration: e.target.value })}
            placeholder="4:23"
            className="w-20 bg-secondary border-input"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTrack()
              }
            }}
          />
          <Button type="button" onClick={addTrack} size="icon" className="flex-shrink-0">
            <Plus size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
