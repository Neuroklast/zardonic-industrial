export interface ThreatScoreEntry {
  score: number
  level: string
  timestamp: string
  reason: string
}

export interface Incident {
  type: string
  key: string
  method: string
  timestamp: string
  threatScore?: number
  threatLevel?: string
}

export interface BehavioralPattern {
  type: string
  severity: string
  description: string
  details: Record<string, unknown>
}

export interface UserAgentInfo {
  userAgent: string
  count: number
  category: string
}

export interface Profile {
  hashedIp: string
  firstSeen: string
  lastSeen: string
  totalIncidents: number
  attackTypes: Record<string, number>
  userAgents: Record<string, number>
  threatScoreHistory: ThreatScoreEntry[]
  incidents: Incident[]
  behavioralPatterns: BehavioralPattern[]
  userAgentAnalysis: {
    total: number
    unique: number
    userAgents: UserAgentInfo[]
    topUserAgent: UserAgentInfo | null
    diversity: string
  }
}

export const SEVERITY_COLORS = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#eab308',
}

export const ATTACK_TYPE_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
]

export const THREAT_LEVEL_COLORS = {
  BLOCK: '#dc2626',
  TARPIT: '#f97316',
  WARN: '#eab308',
  CLEAN: '#22c55e',
}
