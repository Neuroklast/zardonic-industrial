import { createClient } from '@/lib/supabaseServer'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'

interface SoundConfig {
  enabled: boolean
  volume: number
  hoverEnabled: boolean
  clickEnabled?: boolean
  ambientEnabled?: boolean
  ambientVolume?: number
}

async function fetchSoundConfig(): Promise<SoundConfig> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_config').select('value').eq('key', 'sound').single()
    const v = data?.value as Partial<SoundConfig> | undefined
    return {
      enabled: v?.enabled ?? false,
      volume: typeof v?.volume === 'number' ? v.volume : 0.3,
      hoverEnabled: v?.hoverEnabled ?? false,
      clickEnabled: v?.clickEnabled ?? false,
      ambientEnabled: v?.ambientEnabled ?? false,
      ambientVolume: typeof v?.ambientVolume === 'number' ? v.ambientVolume : 0.1,
    }
  } catch {
    return { enabled: false, volume: 0.3, hoverEnabled: false }
  }
}

export default async function SoundPage() {
  const cfg = await fetchSoundConfig()

  async function saveSoundConfig(formData: FormData) {
    'use server'
    const enabled = formData.get('enabled') === 'on'
    const volume = Math.min(1, Math.max(0, Number(formData.get('volume') ?? 0.3)))
    const hoverEnabled = formData.get('hoverEnabled') === 'on'
    const clickEnabled = formData.get('clickEnabled') === 'on'
    const ambientEnabled = formData.get('ambientEnabled') === 'on'
    const ambientVolume = Math.min(1, Math.max(0, Number(formData.get('ambientVolume') ?? 0.1)))

    const fd = new FormData()
    fd.set('key', 'sound')
    fd.set('value', JSON.stringify({ enabled, volume, hoverEnabled, clickEnabled, ambientEnabled, ambientVolume }))
    await updateSiteConfig(fd)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Sound Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Configure UI sound effects and ambient audio for the public site.
        </p>
      </div>

      <form action={saveSoundConfig} className="space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800">

          {/* Master enable */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-white">Enable Sound</p>
              <p className="text-xs text-zinc-400 mt-0.5">Master switch for all UI sounds.</p>
            </div>
            <input
              type="checkbox"
              name="enabled"
              id="sound-enabled"
              defaultChecked={cfg.enabled}
              aria-label="Enable sound"
              className="h-4 w-4 accent-red-600 cursor-pointer"
            />
          </div>

          {/* Master volume */}
          <div className="p-4">
            <label htmlFor="sound-volume" className="text-sm font-medium text-white block mb-1">
              Master Volume
            </label>
            <p className="text-xs text-zinc-400 mb-3">
              Current: {Math.round(cfg.volume * 100)}%
            </p>
            <input
              type="range"
              id="sound-volume"
              name="volume"
              min="0"
              max="1"
              step="0.05"
              defaultValue={cfg.volume}
              className="w-full accent-red-600"
              aria-label="Master volume"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>0%</span><span>100%</span>
            </div>
          </div>

          {/* Hover sounds */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-white">Hover Sounds</p>
              <p className="text-xs text-zinc-400 mt-0.5">Play a subtle sound when hovering interactive elements.</p>
            </div>
            <input
              type="checkbox"
              name="hoverEnabled"
              id="hover-enabled"
              defaultChecked={cfg.hoverEnabled}
              aria-label="Enable hover sounds"
              className="h-4 w-4 accent-red-600 cursor-pointer"
            />
          </div>

          {/* Click sounds */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-white">Click Sounds</p>
              <p className="text-xs text-zinc-400 mt-0.5">Play a click sound on button interactions.</p>
            </div>
            <input
              type="checkbox"
              name="clickEnabled"
              id="click-enabled"
              defaultChecked={cfg.clickEnabled ?? false}
              aria-label="Enable click sounds"
              className="h-4 w-4 accent-red-600 cursor-pointer"
            />
          </div>

          {/* Ambient audio */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-white">Ambient Audio</p>
              <p className="text-xs text-zinc-400 mt-0.5">Play low-level ambient sound in the background.</p>
            </div>
            <input
              type="checkbox"
              name="ambientEnabled"
              id="ambient-enabled"
              defaultChecked={cfg.ambientEnabled ?? false}
              aria-label="Enable ambient audio"
              className="h-4 w-4 accent-red-600 cursor-pointer"
            />
          </div>

          {/* Ambient volume */}
          <div className="p-4">
            <label htmlFor="ambient-volume" className="text-sm font-medium text-white block mb-1">
              Ambient Volume
            </label>
            <p className="text-xs text-zinc-400 mb-3">
              Current: {Math.round((cfg.ambientVolume ?? 0.1) * 100)}%
            </p>
            <input
              type="range"
              id="ambient-volume"
              name="ambientVolume"
              min="0"
              max="1"
              step="0.05"
              defaultValue={cfg.ambientVolume ?? 0.1}
              className="w-full accent-red-600"
              aria-label="Ambient volume"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>0%</span><span>100%</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded font-medium transition-colors"
          >
            Save Sound Settings
          </button>
        </div>
      </form>
    </div>
  )
}
