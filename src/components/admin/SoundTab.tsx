/**
 * SoundTab — inline admin panel page for sound / audio settings.
 * Mirrors the fields in SoundSettingsDialog but without the dialog chrome,
 * so it can be embedded directly inside the AdminPanel's Design > Sound page.
 */

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { FloppyDisk } from '@phosphor-icons/react'
import type { AdminSettings, SoundSettings } from '@/lib/types'

interface SoundTabProps {
  adminSettings: AdminSettings | null | undefined
  setAdminSettings: (s: AdminSettings) => void
}

export default function SoundTab({ adminSettings, setAdminSettings }: SoundTabProps) {
  const [data, setData] = useState<SoundSettings>(adminSettings?.sound ?? {})

  // Keep local copy in sync when adminSettings changes externally (e.g. undo)
  useEffect(() => {
    setData(adminSettings?.sound ?? {})
  }, [adminSettings?.sound])

  const save = () => {
    setAdminSettings({ ...(adminSettings ?? {}), sound: data })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <section className="space-y-3">
        <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
          Sound Settings
        </h3>
        <p className="text-xs text-muted-foreground font-mono">
          Configure sound effects and background music. Local sounds are used by default.
          Add URLs to override with custom audio files (MP3, WAV, OGG). Google Drive share links are supported.
        </p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
          Global
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <Label className="font-mono text-sm">Default Muted</Label>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Sounds muted by default on page load</p>
          </div>
          <Switch
            checked={data.defaultMuted ?? true}
            onCheckedChange={(checked) => setData({ ...data, defaultMuted: checked })}
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
          Sound Effects
        </h3>
        <div className="space-y-1">
          <Label className="font-mono text-xs text-muted-foreground">Terminal Sound URL</Label>
          <Input
            value={data.terminalSound ?? ''}
            onChange={(e) => setData({ ...data, terminalSound: e.target.value || undefined })}
            placeholder="Default: none"
            className="font-mono text-xs"
          />
          <p className="text-[10px] text-muted-foreground font-mono">Plays on terminal keystrokes</p>
        </div>
        <div className="space-y-1">
          <Label className="font-mono text-xs text-muted-foreground">Typing Sound URL</Label>
          <Input
            value={data.typingSound ?? ''}
            onChange={(e) => setData({ ...data, typingSound: e.target.value || undefined })}
            placeholder="Default: texttyping.wav"
            className="font-mono text-xs"
          />
          <p className="text-[10px] text-muted-foreground font-mono">Plays during typing animations</p>
        </div>
        <div className="space-y-1">
          <Label className="font-mono text-xs text-muted-foreground">Button Sound URL</Label>
          <Input
            value={data.buttonSound ?? ''}
            onChange={(e) => setData({ ...data, buttonSound: e.target.value || undefined })}
            placeholder="Default: click.wav"
            className="font-mono text-xs"
          />
          <p className="text-[10px] text-muted-foreground font-mono">Plays on button clicks</p>
        </div>
        <div className="space-y-1">
          <Label className="font-mono text-xs text-muted-foreground">Loading Finished Sound URL</Label>
          <Input
            value={data.loadingFinishedSound ?? ''}
            onChange={(e) => setData({ ...data, loadingFinishedSound: e.target.value || undefined })}
            placeholder="Default: laodingfinished.mp3"
            className="font-mono text-xs"
          />
          <p className="text-[10px] text-muted-foreground font-mono">Plays when page finishes loading</p>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
          Background Music
        </h3>
        <div className="space-y-1">
          <Label className="font-mono text-xs text-muted-foreground">Background Music URL</Label>
          <Input
            value={data.backgroundMusic ?? ''}
            onChange={(e) => setData({ ...data, backgroundMusic: e.target.value || undefined })}
            placeholder="Default: NK - THRESHOLD.mp3"
            className="font-mono text-xs"
          />
          <p className="text-[10px] text-muted-foreground font-mono">Background music that loops continuously</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-mono text-xs">Volume</Label>
            <span className="font-mono text-xs text-muted-foreground">
              {Math.round((data.backgroundMusicVolume ?? 0.3) * 100)}%
            </span>
          </div>
          <Slider
            value={[data.backgroundMusicVolume ?? 0.3]}
            onValueChange={([v]) => setData({ ...data, backgroundMusicVolume: v })}
            min={0}
            max={1}
            step={0.01}
          />
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </section>

      <Button onClick={save} className="w-full font-mono text-xs" variant="outline">
        <FloppyDisk size={14} className="mr-2" />
        Save Sound Settings
      </Button>
    </div>
  )
}
