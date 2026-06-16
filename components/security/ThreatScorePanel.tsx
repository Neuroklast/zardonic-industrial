'use client'

import type { Profile } from '@/components/security/attacker-types'

interface ThreatScorePanelProps {
  profile: Profile
  hashedIp: string
  threatScoreChartData: Array<{ index: number; score: number; level: string; time: string; reason: string }>
  attackTypeChartData: Array<{ name: string; value: number }>
  uaCategoryData: Array<{ name: string; value: number }>
  formatShortTime: (ts: string) => string
}

/** Security analytics panel — charts removed (recharts dependency removed in Next.js migration). */
export function ThreatScorePanel({ profile, hashedIp }: ThreatScorePanelProps) {
  const lastEntry = profile.threatScoreHistory[profile.threatScoreHistory.length - 1]
  const score = lastEntry?.score ?? 0

  return (
    <div className="border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-primary/50 uppercase">IP Hash (SHA-256)</p>
          <p className="font-mono text-xs text-foreground/90 mt-1">{hashedIp}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-primary/50 uppercase">Threat Score</p>
          <p className="font-mono text-2xl font-bold text-foreground mt-1">{score}</p>
        </div>
      </div>
      <p className="font-mono text-xs text-primary/40 uppercase">
        Security analytics charts unavailable in this environment.
      </p>
    </div>
  )
}
