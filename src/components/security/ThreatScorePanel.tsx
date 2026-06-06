import { Warning, Globe, User, ChartLine } from '@phosphor-icons/react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ATTACK_TYPE_COLORS, Profile, SEVERITY_COLORS, THREAT_LEVEL_COLORS } from '@/components/security/attacker-types'

interface ThreatScorePanelProps {
  profile: Profile
  hashedIp: string
  threatScoreChartData: Array<{ index: number; score: number; level: string; time: string; reason: string }>
  attackTypeChartData: Array<{ name: string; value: number }>
  uaCategoryData: Array<{ name: string; value: number }>
  formatShortTime: (ts: string) => string
}

const tooltipContentStyle = {
  backgroundColor: '#000',
  border: '1px solid #333',
  borderRadius: 0,
  fontSize: '11px',
  fontFamily: 'monospace',
}

export function ThreatScorePanel({
  profile,
  hashedIp,
  threatScoreChartData,
  attackTypeChartData,
  uaCategoryData,
  formatShortTime,
}: ThreatScorePanelProps) {
  const getSeverityIcon = (severity: string) => {
    if (severity === 'high') return <Warning size={18} className="text-red-400" weight="bold" />
    if (severity === 'medium') return <Warning size={18} className="text-orange-400" />
    return <Warning size={18} className="text-yellow-400" />
  }

  return (
    <>
      <div className="border border-primary/20 bg-primary/5 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-primary/50 uppercase">IP Hash (SHA-256)</p>
            <p className="font-mono text-xs text-foreground/90 mt-1">{hashedIp}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-primary/50 uppercase">Current Threat Score</p>
            {(() => {
              const lastEntry = profile.threatScoreHistory[profile.threatScoreHistory.length - 1]
              const threatColor = lastEntry?.level
                ? THREAT_LEVEL_COLORS[lastEntry.level as keyof typeof THREAT_LEVEL_COLORS] || '#22c55e'
                : '#22c55e'
              return (
                <p className="font-mono text-[24px] font-bold" style={{ color: threatColor }}>
                  {lastEntry?.score || 0}
                </p>
              )
            })()}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 pt-2 border-t border-primary/10">
          <div>
            <p className="font-mono text-xs text-primary/50">Total Incidents</p>
            <p className="font-mono text-[16px] text-foreground/90 font-bold">{profile.totalIncidents}</p>
          </div>
          <div>
            <p className="font-mono text-xs text-primary/50">First Seen</p>
            <p className="font-mono text-xs text-foreground/80">{formatShortTime(profile.firstSeen)}</p>
          </div>
          <div>
            <p className="font-mono text-xs text-primary/50">Last Seen</p>
            <p className="font-mono text-xs text-foreground/80">{formatShortTime(profile.lastSeen)}</p>
          </div>
          <div>
            <p className="font-mono text-xs text-primary/50">UA Diversity</p>
            <p className="font-mono text-xs text-foreground/80">{profile.userAgentAnalysis.diversity}</p>
          </div>
        </div>
      </div>

      {profile.behavioralPatterns.length > 0 && (
        <div className="border border-primary/20 bg-card p-4">
          <h3 className="font-mono text-xs text-primary/70 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ChartLine size={14} />
            Behavioral Patterns Detected ({profile.behavioralPatterns.length})
          </h3>
          <div className="space-y-2">
            {profile.behavioralPatterns.map((pattern, idx) => (
              <div key={idx} className="border border-primary/10 bg-primary/5 p-3 flex items-start gap-3">
                {getSeverityIcon(pattern.severity)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono text-xs text-foreground/90 uppercase">{pattern.type.replace(/_/g, ' ')}</p>
                    <span
                      className="px-2 py-0.5 text-xs font-mono font-bold rounded"
                      style={{
                        backgroundColor: `${SEVERITY_COLORS[pattern.severity as keyof typeof SEVERITY_COLORS]}30`,
                        color: SEVERITY_COLORS[pattern.severity as keyof typeof SEVERITY_COLORS],
                      }}
                    >
                      {pattern.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-primary/60">{pattern.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-primary/20 bg-card p-4">
          <h3 className="font-mono text-xs text-primary/70 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ChartLine size={14} />
            Threat Score Timeline
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={threatScoreChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#666" style={{ fontSize: '10px' }} tick={{ fill: '#999' }} />
              <YAxis stroke="#666" style={{ fontSize: '10px' }} tick={{ fill: '#999' }} />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-primary/20 bg-card p-4">
          <h3 className="font-mono text-xs text-primary/70 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Globe size={14} />
            Attack Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={attackTypeChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => `${entry.name}: ${entry.value}`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {attackTypeChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ATTACK_TYPE_COLORS[index % ATTACK_TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipContentStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-primary/20 bg-card p-4">
        <h3 className="font-mono text-xs text-primary/70 uppercase tracking-wider mb-3 flex items-center gap-2">
          <User size={14} />
          User-Agent Analysis ({profile.userAgentAnalysis.unique} unique)
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={uaCategoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#666" style={{ fontSize: '10px' }} tick={{ fill: '#999' }} />
              <YAxis stroke="#666" style={{ fontSize: '10px' }} tick={{ fill: '#999' }} />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>

          <div className="border border-primary/10 overflow-hidden">
            <div className="bg-primary/10 px-3 py-2 font-mono text-xs text-primary/60 uppercase">Top User-Agents</div>
            <div className="divide-y divide-primary/10 max-h-[180px] overflow-y-auto">
              {profile.userAgentAnalysis.userAgents.slice(0, 10).map((ua, idx) => (
                <div key={idx} className="px-3 py-2 flex items-center justify-between hover:bg-primary/5">
                  <div className="flex-1 mr-2">
                    <p className="font-mono text-xs text-foreground/80 truncate" title={ua.userAgent}>
                      {ua.userAgent}
                    </p>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.5 text-[8px] font-mono rounded ${
                        ua.category === 'attack_tool'
                          ? 'bg-red-500/20 text-red-400'
                          : ua.category === 'bot'
                            ? 'bg-orange-500/20 text-orange-400'
                            : ua.category === 'script'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {ua.category}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-primary/60">{ua.count}×</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
