import { ADMIN_HELP_INDEX, type AdminHelpEntry } from '@/lib/admin-help-index'

/** Max items shown when the search box is empty (browse mode). */
export const ADMIN_HELP_BROWSE_LIMIT = 30

export interface AdminHelpSearchResult {
  entry: AdminHelpEntry
  score: number
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function tokenize(query: string): string[] {
  return normalize(query)
    .split(/[\s,/+-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

function fieldScore(haystack: string, token: string, weight: number): number {
  if (!haystack.includes(token)) return 0
  if (haystack === token) return weight * 3
  if (haystack.startsWith(token)) return weight * 2
  return weight
}

function scoreEntry(entry: AdminHelpEntry, tokens: string[]): number {
  const title = normalize(entry.title)
  const description = normalize(entry.description)
  const group = normalize(entry.group)
  const keywords = entry.keywords.map(normalize)
  const full = normalize([entry.title, entry.description, entry.group, ...entry.keywords].join(' '))

  let total = 0
  for (const token of tokens) {
    let tokenScore = 0
    tokenScore += fieldScore(title, token, 12)
    for (const kw of keywords) {
      tokenScore += fieldScore(kw, token, 9)
    }
    tokenScore += fieldScore(description, token, 5)
    tokenScore += fieldScore(group, token, 3)
    if (full.includes(token)) tokenScore += 1
    total += tokenScore
  }
  return total
}

/**
 * Search admin help entries by title, description, group and keywords.
 * Empty query returns browse list sorted by priority.
 */
export function searchAdminHelp(
  query: string,
  entries: AdminHelpEntry[] = ADMIN_HELP_INDEX
): AdminHelpSearchResult[] {
  const trimmed = query.trim()
  if (!trimmed) {
    return entries
      .slice()
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .slice(0, ADMIN_HELP_BROWSE_LIMIT)
      .map((entry) => ({ entry, score: entry.priority ?? 0 }))
  }

  const tokens = tokenize(trimmed)
  if (tokens.length === 0) {
    return entries.map((entry) => ({ entry, score: 0 }))
  }

  const results: AdminHelpSearchResult[] = []
  for (const entry of entries) {
    const score = scoreEntry(entry, tokens)
    if (score > 0) results.push({ entry, score })
  }

  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (b.entry.priority ?? 0) - (a.entry.priority ?? 0)
  })
}

/** Group search results by entry.group, preserving score order within each group. */
export function groupAdminHelpResults(
  results: AdminHelpSearchResult[],
  groupOrder: string[]
): Array<{ group: string; items: AdminHelpSearchResult[] }> {
  const byGroup = new Map<string, AdminHelpSearchResult[]>()
  for (const result of results) {
    const list = byGroup.get(result.entry.group) ?? []
    list.push(result)
    byGroup.set(result.entry.group, list)
  }

  const ordered: Array<{ group: string; items: AdminHelpSearchResult[] }> = []
  for (const group of groupOrder) {
    const items = byGroup.get(group)
    if (items && items.length > 0) ordered.push({ group, items })
    byGroup.delete(group)
  }
  for (const [group, items] of byGroup) {
    ordered.push({ group, items })
  }
  return ordered
}