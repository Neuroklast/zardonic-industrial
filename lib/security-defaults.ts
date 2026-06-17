export interface SecuritySettings {
  honeytokensEnabled: boolean
  rateLimitEnabled: boolean
  robotsTrapEnabled: boolean
  entropyInjectionEnabled: boolean
  suspiciousUaBlockingEnabled: boolean
  sessionBindingEnabled: boolean
  maxAlertsStored: number
  tarpitMinMs: number
  tarpitMaxMs: number
  sessionTtlSeconds: number
  threatScoringEnabled: boolean
  zipBombEnabled: boolean
  alertingEnabled: boolean
  hardBlockEnabled: boolean
  autoBlockThreshold: number
  warnThreshold: number
  tarpitThreshold: number
  pointsRobotsViolation: number
  pointsHoneytokenAccess: number
  pointsSuspiciousUa: number
  pointsMissingHeaders: number
  pointsGenericAccept: number
  pointsRateLimitExceeded: number
  discordWebhookUrl: string
  alertEmail: string
}

export const DEFAULT_SETTINGS: SecuritySettings = {
  honeytokensEnabled: true,
  rateLimitEnabled: true,
  robotsTrapEnabled: true,
  entropyInjectionEnabled: true,
  suspiciousUaBlockingEnabled: true,
  sessionBindingEnabled: true,
  maxAlertsStored: 500,
  tarpitMinMs: 3000,
  tarpitMaxMs: 8000,
  sessionTtlSeconds: 14400,
  threatScoringEnabled: true,
  zipBombEnabled: false,
  alertingEnabled: false,
  hardBlockEnabled: true,
  autoBlockThreshold: 12,
  warnThreshold: 3,
  tarpitThreshold: 7,
  pointsRobotsViolation: 3,
  pointsHoneytokenAccess: 5,
  pointsSuspiciousUa: 4,
  pointsMissingHeaders: 2,
  pointsGenericAccept: 1,
  pointsRateLimitExceeded: 2,
  discordWebhookUrl: '',
  alertEmail: '',
}
