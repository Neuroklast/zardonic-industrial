export interface SecurityIncident {
  key: string
  method: string
  hashedIp: string
  userAgent: string
  timestamp: string
  threatScore?: number
  threatLevel?: string
  countermeasure?: string
  countermeasureDetails?: string
  autoBlocked?: boolean
  blockExpiry?: string
}

/** Classify incident type from the key field */
export function classifyIncident(key: string): { type: string; label: string; color: string } {
  if (key.startsWith('robots:')) return { type: 'robots', label: 'ROBOTS.TXT VIOLATION', color: 'text-orange-400' }
  if (key.startsWith('threat:')) return { type: 'threat', label: 'THREAT ESCALATION', color: 'text-purple-400' }
  if (key.startsWith('blocked:')) return { type: 'blocked', label: 'HARD BLOCK', color: 'text-red-600' }
  if (key.includes('backup') || key.includes('credential') || key.includes('master-key') || key.includes('password'))
    return { type: 'honeytoken', label: 'HONEYTOKEN ACCESS', color: 'text-red-400' }
  return { type: 'event', label: 'SECURITY EVENT', color: 'text-yellow-400' }
}

export function classifyCountermeasure(incident: SecurityIncident): string {
  if (incident.autoBlocked) return 'BLOCKED'
  if (incident.countermeasure) return incident.countermeasure
  if (incident.threatLevel === 'BLOCK') return 'BLOCKED'
  if (incident.threatLevel === 'TARPIT') return 'TARPITTED'
  if (incident.threatLevel === 'WARN') return 'RATE_LIMITED'
  if (incident.key.startsWith('blocked:')) return 'BLOCKED'
  if (incident.key.startsWith('threat:')) return 'TARPITTED'
  return 'LOGGED'
}
