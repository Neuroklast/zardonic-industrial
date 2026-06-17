import { List } from '@phosphor-icons/react'
import type { Profile } from '@/components/security/attacker-types'
import { THREAT_LEVEL_COLORS } from '@/components/security/attacker-types'

export function AttackerTimeline({ profile, formatShortTime }: { profile: Profile; formatShortTime: (ts: string) => string }) {
  return (
    <div className="border border-primary/20 bg-card p-4">
      <h3 className="font-mono text-xs text-primary/70 uppercase tracking-wider mb-3 flex items-center gap-2">
        <List size={14} />
        Recent Incidents ({profile.incidents.length})
      </h3>
      <div className="border border-primary/10 overflow-hidden">
        <div className="bg-primary/10 px-3 py-2 grid grid-cols-[1fr,2fr,1fr,1fr,1fr] gap-2 font-mono text-xs text-primary/60 uppercase">
          <span>Time</span>
          <span>Type</span>
          <span>Method</span>
          <span>Score</span>
          <span>Level</span>
        </div>
        <div className="divide-y divide-primary/10 max-h-[250px] overflow-y-auto">
          {profile.incidents.slice().reverse().map((incident, idx) => (
            <div key={idx} className="px-3 py-2 grid grid-cols-[1fr,2fr,1fr,1fr,1fr] gap-2 hover:bg-primary/5">
              <span className="font-mono text-xs text-primary/50">{formatShortTime(incident.timestamp)}</span>
              <span className="font-mono text-xs text-foreground/80 truncate" title={incident.key}>
                {incident.type.replace(/_/g, ' ')}
              </span>
              <span className="font-mono text-xs text-primary/60">{incident.method}</span>
              <span className="font-mono text-xs text-foreground/80">{incident.threatScore || '—'}</span>
              <span
                className="font-mono text-xs px-1.5 py-0.5 rounded w-fit"
                style={{
                  backgroundColor: incident.threatLevel
                    ? `${THREAT_LEVEL_COLORS[incident.threatLevel as keyof typeof THREAT_LEVEL_COLORS]}30`
                    : '#33333330',
                  color: incident.threatLevel ? THREAT_LEVEL_COLORS[incident.threatLevel as keyof typeof THREAT_LEVEL_COLORS] : '#666',
                }}
              >
                {incident.threatLevel || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
