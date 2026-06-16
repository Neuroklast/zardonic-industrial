import { Shield } from '@phosphor-icons/react'
import type { Profile } from '@/components/security/attacker-types'

export function AttackerActions({ profile }: { profile: Profile; formatShortTime: (ts: string) => string }) {
  const blocked = profile.incidents.filter(incident => incident.threatLevel === 'BLOCK' || incident.key?.startsWith('blocked:'))
  const tarpitted = profile.incidents.filter(incident => incident.threatLevel === 'TARPIT' || incident.key?.startsWith('threat:'))
  const warned = profile.incidents.filter(incident => incident.threatLevel === 'WARN')
  const firstAlert =
    profile.incidents.length > 0
      ? [...profile.incidents].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0]
      : null

  return (
    <div className="border border-primary/20 bg-card p-4">
      <h3 className="font-mono text-xs text-primary/70 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Shield size={14} />
        Automatische Reaktionen
      </h3>
      <div className="space-y-2 text-xs font-mono">
        {firstAlert && (
          <p className="text-foreground/60">
            <span className="text-primary/50">Erster Alert:</span> {new Date(firstAlert.timestamp).toLocaleString('de-DE')}
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="border border-red-500/20 bg-red-500/5 p-2 text-center">
            <p className="text-red-400 text-lg font-bold">{blocked.length}</p>
            <p className="text-xs text-red-400/60 uppercase">BLOCKED</p>
          </div>
          <div className="border border-orange-500/20 bg-orange-500/5 p-2 text-center">
            <p className="text-orange-400 text-lg font-bold">{tarpitted.length}</p>
            <p className="text-xs text-orange-400/60 uppercase">TARPITTED</p>
          </div>
          <div className="border border-yellow-500/20 bg-yellow-500/5 p-2 text-center">
            <p className="text-yellow-400 text-lg font-bold">{warned.length}</p>
            <p className="text-xs text-yellow-400/60 uppercase">GEWARNT</p>
          </div>
        </div>
        <p className="text-xs text-foreground/40 mt-2">
          IP Status: {blocked.length > 0 ? 'War geblockt' : tarpitted.length > 0 ? 'War getarpit' : 'Überwacht'}
        </p>
      </div>
    </div>
  )
}
