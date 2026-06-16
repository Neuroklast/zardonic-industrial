import { Shield, X } from '@phosphor-icons/react'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useState, useEffect, useCallback } from 'react'
import { AttackerActions } from '@/components/security/AttackerActions'
import { AttackerTimeline } from '@/components/security/AttackerTimeline'
import { ThreatScorePanel } from '@/components/security/ThreatScorePanel'
import type { Profile } from '@/components/security/attacker-types'

interface AttackerProfileDialogProps {
  open: boolean
  onClose: () => void
  hashedIp: string
}

export default function AttackerProfileDialog({ open, onClose, hashedIp }: AttackerProfileDialogProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/attacker-profile?hashedIp=${hashedIp}`, { credentials: 'same-origin' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setProfile(data.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [hashedIp])

  useEffect(() => {
    if (!open || !hashedIp) return
    void loadProfile()
  }, [open, hashedIp, loadProfile])

  const formatShortTime = (ts: string) => {
    try {
      const date = new Date(ts)
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ts
    }
  }

  const threatScoreChartData =
    profile?.threatScoreHistory.map((entry, idx) => ({
      index: idx + 1,
      score: entry.score,
      level: entry.level,
      time: formatShortTime(entry.timestamp),
      reason: entry.reason,
    })) || []

  const attackTypeChartData = Object.entries(profile?.attackTypes || {})
    .map(([type, count]) => ({
      name: type.replace(/_/g, ' ').toUpperCase(),
      value: count,
    }))
    .sort((a, b) => b.value - a.value)

  const uaCategoryData =
    profile?.userAgentAnalysis.userAgents.reduce((acc, ua) => {
      const existing = acc.find(item => item.name === ua.category)
      if (existing) {
        existing.value += ua.count
      } else {
        acc.push({ name: ua.category.toUpperCase(), value: ua.count })
      }
      return acc
    }, [] as { name: string; value: number }[]) || []

  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
      <DialogContent data-admin-ui="true" className="w-full max-w-6xl bg-card border border-primary/30 p-0 overflow-hidden flex flex-col max-h-[90dvh] [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Attacker Profile</DialogTitle>

        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/50 pointer-events-none" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/50 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/50 pointer-events-none" />

        <div className="h-10 bg-primary/10 border-b border-primary/30 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-primary/70" />
            <span className="font-mono text-xs text-primary/70 tracking-wider uppercase">
              ATTACKER PROFILE // DETAILED ANALYSIS
            </span>
          </div>
          <DialogClose className="text-primary/60 hover:text-primary transition-colors font-mono text-xs tracking-wider uppercase flex items-center gap-1">
            <X size={12} /> CLOSE
          </DialogClose>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
              <span className="ml-3 font-mono text-xs text-primary/50">LOADING PROFILE...</span>
            </div>
          )}

          {error && (
            <div className="border border-red-500/30 bg-red-500/10 p-4 text-center">
              <p className="font-mono text-xs text-red-400">FAILED TO LOAD: {error}</p>
            </div>
          )}

          {!loading && !error && profile && (
            <>
              <ThreatScorePanel
                profile={profile}
                hashedIp={hashedIp}
                threatScoreChartData={threatScoreChartData}
                attackTypeChartData={attackTypeChartData}
                uaCategoryData={uaCategoryData}
                formatShortTime={formatShortTime}
              />
              <AttackerTimeline profile={profile} formatShortTime={formatShortTime} />
              <AttackerActions profile={profile} formatShortTime={formatShortTime} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
