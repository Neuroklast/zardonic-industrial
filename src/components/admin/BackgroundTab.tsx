import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { TabsContent } from '@/components/ui/tabs'
import type { AdminSettings, AnimationSettings, BackgroundType, HudTexts } from '@/lib/types'

interface BackgroundTabProps {
  adminSettings?: AdminSettings | null
  setAdminSettings?: (s: AdminSettings) => void
  anim: AnimationSettings
  updateAnimationNumber: (key: keyof AnimationSettings, value: number) => void
}

export default function BackgroundTab({
  adminSettings,
  setAdminSettings,
  anim,
  updateAnimationNumber,
}: BackgroundTabProps) {
  const currentBg = anim.backgroundType ?? 'circuit'

  const updateAnim = (patch: Partial<AnimationSettings>) => {
    setAdminSettings?.({
      ...(adminSettings ?? {}),
      animations: { ...anim, ...patch },
    })
  }

  return (
    <TabsContent value="background" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
      {/* Background type selector */}
      <section className="space-y-3">
        <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
          Background Style
        </h3>
        <div className="grid grid-cols-1 gap-1.5">
          {([
            { value: 'circuit', label: 'Circuit Board (Default)', desc: 'Animated red circuit traces' },
            { value: 'cyberpunk-hud', label: 'Cyberpunk HUD', desc: 'HUD overlay with corner brackets & scan beam' },
            { value: 'matrix', label: 'Matrix Rain', desc: 'Cascading Japanese characters' },
            { value: 'stars', label: 'Star Field', desc: 'Warp-speed star field' },
            { value: 'cloud-chamber', label: 'Cloud Chamber', desc: 'Radiation cloud chamber with noise, terminal glow & particles' },
            { value: 'minimal', label: 'Minimal', desc: 'No decorative background' },
          ] as { value: BackgroundType; label: string; desc: string }[]).map(opt => (
            <button
              key={opt.value}
              onClick={() => updateAnim({ backgroundType: opt.value })}
              className={`text-left px-3 py-2 border rounded font-mono text-xs transition-colors ${
                currentBg === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <div className="font-semibold">{opt.label}</div>
              <div className="text-muted-foreground/60 text-[10px]">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Per-background config */}

      {/* Circuit board options */}
      {currentBg === 'circuit' && (
        <section className="space-y-3">
          <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
            Circuit Board Options
          </h3>
          <p className="font-mono text-xs text-muted-foreground">
            The circuit board background uses the primary colour theme. Adjust CRT effects below.
          </p>
          <div className="flex items-center justify-between">
            <Label className="font-mono text-xs">Noise layer</Label>
            <Switch
              checked={anim.noiseEnabled !== false}
              onCheckedChange={(v) => updateAnim({ noiseEnabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="font-mono text-xs">Scanlines</Label>
            <Switch
              checked={anim.scanlineEnabled !== false}
              onCheckedChange={(v) => updateAnim({ scanlineEnabled: v })}
            />
          </div>
        </section>
      )}

      {/* Matrix options */}
      {currentBg === 'matrix' && (
        <section className="space-y-3">
          <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
            Matrix Rain Options
          </h3>
          <div className="flex items-center justify-between">
            <Label className="font-mono text-xs">Noise layer</Label>
            <Switch
              checked={anim.noiseEnabled !== false}
              onCheckedChange={(v) => updateAnim({ noiseEnabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="font-mono text-xs">Scanlines</Label>
            <Switch
              checked={anim.scanlineEnabled !== false}
              onCheckedChange={(v) => updateAnim({ scanlineEnabled: v })}
            />
          </div>
        </section>
      )}

      {/* Stars options */}
      {currentBg === 'stars' && (
        <section className="space-y-3">
          <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
            Star Field Options
          </h3>
          <div className="flex items-center justify-between">
            <Label className="font-mono text-xs">Noise layer</Label>
            <Switch
              checked={anim.noiseEnabled !== false}
              onCheckedChange={(v) => updateAnim({ noiseEnabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="font-mono text-xs">Scanlines</Label>
            <Switch
              checked={anim.scanlineEnabled !== false}
              onCheckedChange={(v) => updateAnim({ scanlineEnabled: v })}
            />
          </div>
        </section>
      )}

      {/* Cloud chamber options */}
      {currentBg === 'cloud-chamber' && (
        <section className="space-y-3">
          <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
            Cloud Chamber Options
          </h3>
          <p className="font-mono text-xs text-muted-foreground">
            Radiation cloud chamber with particle tracks, noise static, and terminal phosphor glow.
          </p>
          <div className="flex items-center justify-between">
            <Label className="font-mono text-xs">Noise static</Label>
            <Switch
              checked={anim.noiseEnabled !== false}
              onCheckedChange={(v) => updateAnim({ noiseEnabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="font-mono text-xs">Scanlines</Label>
            <Switch
              checked={anim.scanlineEnabled !== false}
              onCheckedChange={(v) => updateAnim({ scanlineEnabled: v })}
            />
          </div>
        </section>
      )}

      {/* HUD texts - only shown when cyberpunk-hud is active */}
      {currentBg === 'cyberpunk-hud' && (
        <section className="space-y-3">
          <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
            HUD Texts
          </h3>
          <p className="font-mono text-xs text-muted-foreground">
            Customize the data readouts shown in the corners of the Cyberpunk HUD background.
          </p>
          {([
            { key: 'topLeft1', label: 'Top-left line 1', placeholder: 'SYSTEM: ONLINE' },
            { key: 'topLeft2', label: 'Top-left line 2 (blank = live clock)', placeholder: 'TIME: auto' },
            { key: 'topLeftStatus', label: 'Top-left status', placeholder: 'ACTIVE' },
            { key: 'topRight1', label: 'Top-right line 1', placeholder: 'NEUROKLAST v1.0' },
            { key: 'topRight2', label: 'Top-right line 2 (blank = auto ID)', placeholder: 'ID: auto' },
            { key: 'bottomLeft1', label: 'Bottom-left line 1', placeholder: 'PROTOCOL: TECHNO' },
            { key: 'bottomLeft2', label: 'Bottom-left line 2', placeholder: 'STATUS: TRANSMITTING' },
            { key: 'bottomRight1', label: 'Bottom-right line 1', placeholder: 'FREQ: 140-180 BPM' },
            { key: 'bottomRight2', label: 'Bottom-right line 2', placeholder: 'MODE: HARD' },
          ] as { key: keyof HudTexts; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="font-mono text-xs text-muted-foreground">{label}</Label>
              <Input
                value={adminSettings?.hudTexts?.[key] ?? ''}
                onChange={e => setAdminSettings?.({ ...(adminSettings ?? {}), hudTexts: { ...adminSettings?.hudTexts, [key]: e.target.value || undefined } })}
                className="font-mono text-xs"
                placeholder={placeholder}
              />
            </div>
          ))}
        </section>
      )}

      <Separator />

      {/* CRT Effects */}
      <section className="space-y-3">
        <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
          CRT Effects
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs">CRT Overlay Opacity</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {Math.round(
                  (typeof anim.crtOverlayOpacity === 'number' ? anim.crtOverlayOpacity : 0.6) * 100,
                )}%
              </span>
            </div>
            <Slider
              value={[
                typeof anim.crtOverlayOpacity === 'number'
                  ? anim.crtOverlayOpacity * 100
                  : 60,
              ]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => updateAnimationNumber('crtOverlayOpacity', v / 100)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs">CRT Vignette Opacity</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {Math.round(
                  (typeof anim.crtVignetteOpacity === 'number' ? anim.crtVignetteOpacity : 0.3) * 100,
                )}%
              </span>
            </div>
            <Slider
              value={[
                typeof anim.crtVignetteOpacity === 'number'
                  ? anim.crtVignetteOpacity * 100
                  : 30,
              ]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => updateAnimationNumber('crtVignetteOpacity', v / 100)}
            />
          </div>
        </div>
      </section>
    </TabsContent>
  )
}
