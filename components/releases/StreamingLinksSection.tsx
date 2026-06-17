import { ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StreamingLinksSectionProps {
  spotify: string
  soundcloud: string
  bandcamp: string
  youtube: string
  appleMusic: string
  beatport: string
  onChange: (field: string, value: string) => void
  releaseId?: string
  isSyncing: boolean
  onSync: () => void
  isSaving: boolean
}

export function StreamingLinksSection({
  spotify,
  soundcloud,
  bandcamp,
  youtube,
  appleMusic,
  beatport,
  onChange,
  releaseId,
  isSyncing,
  onSync,
  isSaving,
}: StreamingLinksSectionProps) {
  return (
    <div className="border-t border-border pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Streaming Links (optional)</h4>
        {releaseId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isSyncing || isSaving}
            className="border-primary/30 hover:bg-primary/10 text-xs gap-1.5"
            title="Sync streaming links from Odesli"
          >
            <ArrowsClockwise size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing…' : 'Sync Odesli'}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="spotify">Spotify</Label>
          <Input
            id="spotify"
            type="url"
            value={spotify}
            onChange={e => onChange('spotify', e.target.value)}
            className="bg-secondary border-input"
            placeholder="https://open.spotify.com/..."
          />
        </div>

        <div>
          <Label htmlFor="soundcloud">SoundCloud</Label>
          <Input
            id="soundcloud"
            type="url"
            value={soundcloud}
            onChange={e => onChange('soundcloud', e.target.value)}
            className="bg-secondary border-input"
            placeholder="https://soundcloud.com/..."
          />
        </div>

        <div>
          <Label htmlFor="youtube">YouTube</Label>
          <Input
            id="youtube"
            type="url"
            value={youtube}
            onChange={e => onChange('youtube', e.target.value)}
            className="bg-secondary border-input"
            placeholder="https://youtube.com/..."
          />
        </div>

        <div>
          <Label htmlFor="bandcamp">Bandcamp</Label>
          <Input
            id="bandcamp"
            type="url"
            value={bandcamp}
            onChange={e => onChange('bandcamp', e.target.value)}
            className="bg-secondary border-input"
            placeholder="https://bandcamp.com/..."
          />
        </div>

        <div>
          <Label htmlFor="appleMusic">Apple Music</Label>
          <Input
            id="appleMusic"
            type="url"
            value={appleMusic}
            onChange={e => onChange('appleMusic', e.target.value)}
            className="bg-secondary border-input"
            placeholder="https://music.apple.com/..."
          />
        </div>

        <div>
          <Label htmlFor="beatport">Beatport</Label>
          <Input
            id="beatport"
            type="url"
            value={beatport}
            onChange={e => onChange('beatport', e.target.value)}
            className="bg-secondary border-input"
            placeholder="https://beatport.com/..."
          />
        </div>
      </div>
    </div>
  )
}
