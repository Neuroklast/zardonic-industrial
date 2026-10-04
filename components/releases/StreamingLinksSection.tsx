import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Manual streaming-link editor.
 *
 * There is **no** cross-platform link-resolution API any more: Odesli
 * (song.link) was shut down. Automatic links now come only from the source
 * APIs during import/sync (Spotify/iTunes/Discogs each return their own
 * platform URL); everything else is entered by hand here. Existing stored
 * links (including previously Odesli-enriched platforms) are preserved.
 */
interface StreamingLinksSectionProps {
  spotify: string
  soundcloud: string
  bandcamp: string
  youtube: string
  appleMusic: string
  beatport: string
  onChange: (field: string, value: string) => void
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
  isSaving,
}: StreamingLinksSectionProps) {
  return (
    <div className="border-t border-border pt-4">
      <div className="mb-3">
        <h4 className="font-semibold">Streaming Links (optional)</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Platform links are imported from the source API on sync; add or correct them here.
        </p>
      </div>

      <fieldset disabled={isSaving} className="space-y-3">
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
      </fieldset>
    </div>
  )
}
