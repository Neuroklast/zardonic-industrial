/**
 * Rewrite stored media URLs after an R2 bucket / public-host migration.
 *
 * Detects:
 * - Direct `*.r2.dev` / `*.r2.cloudflarestorage.com` URLs
 * - `wsrv.nl` / `images.weserv.nl` proxies whose `url=` param is an R2 object
 *
 * Output is always `${R2_PUBLIC_HOST}/${objectKey}` (wsrv unwrapped). Runtime
 * code may wrap R2 rasters through wsrv again for canvas CORS.
 */

export const MEDIA_HOST_REWRITE_PAGE_SIZE = 500
export const MEDIA_HOST_REWRITE_SAMPLE_LIMIT = 20

const WSRV_HOSTS = new Set(['wsrv.nl', 'images.weserv.nl'])
const URL_IN_TEXT = /https?:\/\/[^\s"'<>\\]+/gi

export interface MediaHostRewriteSample {
  table: string
  id: string
  field: string
  from: string
  to: string
}

export interface MediaHostRewriteResult {
  publicHost: string
  dryRun: boolean
  scannedRows: number
  rewrittenRows: number
  replacements: number
  byTable: Record<string, number>
  samples: MediaHostRewriteSample[]
}

export interface MediaRewriteSelectResult {
  data: Record<string, unknown>[] | null
  error: { message: string } | null
}

export interface MediaRewriteClient {
  from: (table: string) => {
    select: (columns: string) => {
      order: (column: string) => {
        range: (from: number, to: number) => Promise<MediaRewriteSelectResult>
      }
    }
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
    }
  }
}

export interface MediaHostRewriteTableTarget {
  table: string
  idColumn: 'id' | 'key'
  /** Absolute media URL columns (cover_url, logo_url, …). */
  urlColumns?: readonly string[]
  /** Free text that may embed media URLs (bio, news body). */
  textColumns?: readonly string[]
  /** Optional storage-path column filled from a rewritten URL when empty. */
  pathColumn?: string
}

export const MEDIA_HOST_REWRITE_TABLES: readonly MediaHostRewriteTableTarget[] = [
  {
    table: 'releases',
    idColumn: 'id',
    urlColumns: ['cover_url'],
    pathColumn: 'cover_storage_path',
  },
  {
    table: 'gallery',
    idColumn: 'id',
    urlColumns: ['image_url'],
    pathColumn: 'storage_path',
  },
  {
    table: 'partners',
    idColumn: 'id',
    urlColumns: ['logo_url'],
    pathColumn: 'logo_storage_path',
  },
  {
    table: 'social_links',
    idColumn: 'id',
    urlColumns: ['logo_url'],
    pathColumn: 'logo_storage_path',
  },
  {
    table: 'merchandise',
    idColumn: 'id',
    urlColumns: ['image_url'],
    pathColumn: 'image_storage_path',
  },
  {
    table: 'soundpacks',
    idColumn: 'id',
    urlColumns: ['image_url'],
    pathColumn: 'image_storage_path',
  },
  {
    table: 'media_downloads',
    idColumn: 'id',
    urlColumns: ['file_url'],
    pathColumn: 'file_storage_path',
  },
  {
    table: 'news_posts',
    idColumn: 'id',
    urlColumns: ['cover_url'],
    textColumns: ['body'],
    pathColumn: 'cover_storage_path',
  },
  {
    table: 'bio',
    idColumn: 'id',
    textColumns: ['content'],
  },
]

export function normalizeR2PublicHost(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(withProto)
    if (parsed.protocol !== 'https:' || !parsed.hostname) return null
    return parsed.origin
  } catch {
    return null
  }
}

export function isR2MediaHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host.endsWith('.r2.dev') || host.endsWith('.r2.cloudflarestorage.com')
}

export function objectKeyFromR2Url(url: URL, mediaBucket?: string): string | null {
  let path = url.pathname
  try {
    path = decodeURIComponent(path)
  } catch {
    // keep encoded path
  }
  path = path.replace(/^\/+/, '')
  if (!path || path.includes('..') || path.includes('\\')) return null

  if (url.hostname.toLowerCase().endsWith('.r2.cloudflarestorage.com') && mediaBucket) {
    const prefix = `${mediaBucket}/`
    if (path === mediaBucket) return null
    if (path.startsWith(prefix)) path = path.slice(prefix.length)
  }
  if (!path) return null
  return path
}

export function parseHttpUrl(raw: string): URL | null {
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed
  } catch {
    return null
  }
}

export function innerUrlFromWsrv(url: URL): string | null {
  if (!WSRV_HOSTS.has(url.hostname.toLowerCase())) return null
  const inner = url.searchParams.get('url')
  return inner?.trim() ? inner.trim() : null
}

/**
 * Object key (or pathname) stored in a URL, wsrv wrapper, or raw storage path.
 * Percent-decoding happens via URL parsing (`%3A` / `%2F` in `wsrv.nl/?url=`).
 */
export function extractStoredObjectPath(
  raw: string,
  mediaBucket?: string,
): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('.')
  ) {
    return null
  }

  const parsed = parseHttpUrl(trimmed)
  if (parsed) {
    const innerRaw = innerUrlFromWsrv(parsed)
    const mediaUrl = innerRaw ? parseHttpUrl(innerRaw) : parsed
    if (!mediaUrl) return null
    return objectKeyFromR2Url(mediaUrl, mediaBucket)
  }

  if (/^https?:\/\//i.test(trimmed)) return null
  if (trimmed.includes('..') || trimmed.includes('\\') || /\s/.test(trimmed)) return null
  if (trimmed.length > 500) return null
  return trimmed.replace(/^\/+/, '') || null
}

function stripTrailingUrlJunk(raw: string): { url: string; trailing: string } {
  const match = raw.match(/^(.*?)([),.;:!?]+)$/)
  if (!match) return { url: raw, trailing: '' }
  return { url: match[1], trailing: match[2] }
}

function clipSample(value: string, max = 180): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

/**
 * If `raw` is an R2 public URL or a wsrv proxy of one, return it on `publicOrigin`.
 * Returns null when the string is not R2 media, or is already the direct current-host URL.
 */
export function rewriteR2MediaUrl(
  raw: string,
  publicOrigin: string,
  options?: { mediaBucket?: string },
): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = parseHttpUrl(trimmed)
  if (!parsed) return null

  const origin = publicOrigin.replace(/\/$/, '')
  const innerRaw = innerUrlFromWsrv(parsed)
  const mediaUrl = innerRaw ? parseHttpUrl(innerRaw) : parsed
  if (!mediaUrl || !isR2MediaHostname(mediaUrl.hostname)) return null

  const key = objectKeyFromR2Url(mediaUrl, options?.mediaBucket)
  if (!key) return null

  const next = `${origin}/${key}`
  if (next === trimmed) return null
  return next
}

export function rewriteR2MediaString(
  value: string,
  publicOrigin: string,
  options?: { mediaBucket?: string },
): { next: string; replacements: number } | null {
  const whole = rewriteR2MediaUrl(value, publicOrigin, options)
  if (whole !== null) {
    return { next: whole, replacements: 1 }
  }

  let replacements = 0
  const next = value.replace(URL_IN_TEXT, (match) => {
    const { url, trailing } = stripTrailingUrlJunk(match)
    const rewritten = rewriteR2MediaUrl(url, publicOrigin, options)
    if (!rewritten) return match
    replacements += 1
    return `${rewritten}${trailing}`
  })
  if (replacements === 0) return null
  return { next, replacements }
}

export function rewriteR2MediaJson(
  value: unknown,
  publicOrigin: string,
  options?: { mediaBucket?: string },
): { value: unknown; replacements: number } {
  if (typeof value === 'string') {
    const result = rewriteR2MediaString(value, publicOrigin, options)
    if (!result) return { value, replacements: 0 }
    return { value: result.next, replacements: result.replacements }
  }
  if (Array.isArray(value)) {
    let replacements = 0
    const next = value.map((item) => {
      const rewritten = rewriteR2MediaJson(item, publicOrigin, options)
      replacements += rewritten.replacements
      return rewritten.value
    })
    return { value: next, replacements }
  }
  if (value && typeof value === 'object') {
    let replacements = 0
    const next: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const rewritten = rewriteR2MediaJson(nested, publicOrigin, options)
      replacements += rewritten.replacements
      next[key] = rewritten.value
    }
    return { value: next, replacements }
  }
  return { value, replacements: 0 }
}

function emptyResult(publicHost: string, dryRun: boolean): MediaHostRewriteResult {
  return {
    publicHost,
    dryRun,
    scannedRows: 0,
    rewrittenRows: 0,
    replacements: 0,
    byTable: {},
    samples: [],
  }
}

function selectColumnsFor(target: MediaHostRewriteTableTarget): string {
  const columns = new Set<string>([target.idColumn])
  for (const column of target.urlColumns ?? []) columns.add(column)
  for (const column of target.textColumns ?? []) columns.add(column)
  if (target.pathColumn) columns.add(target.pathColumn)
  return [...columns].join(', ')
}

async function fetchAllRows(
  client: MediaRewriteClient,
  table: string,
  columns: string,
  orderColumn: string,
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = []
  let from = 0
  for (;;) {
    const result = await client
      .from(table)
      .select(columns)
      .order(orderColumn)
      .range(from, from + MEDIA_HOST_REWRITE_PAGE_SIZE - 1)
    if (result.error) {
      throw new Error(`${table}: ${result.error.message}`)
    }
    const batch = result.data ?? []
    rows.push(...batch)
    if (batch.length < MEDIA_HOST_REWRITE_PAGE_SIZE) break
    from += MEDIA_HOST_REWRITE_PAGE_SIZE
  }
  return rows
}

function pushSample(
  samples: MediaHostRewriteSample[],
  sample: MediaHostRewriteSample,
): void {
  if (samples.length >= MEDIA_HOST_REWRITE_SAMPLE_LIMIT) return
  samples.push({
    ...sample,
    from: clipSample(sample.from),
    to: clipSample(sample.to),
  })
}

function pathFromRewrittenUrl(url: string, publicOrigin: string): string | null {
  const parsed = parseHttpUrl(url)
  if (!parsed || parsed.origin !== publicOrigin) return null
  return objectKeyFromR2Url(parsed)
}

async function rewriteTable(
  client: MediaRewriteClient,
  target: MediaHostRewriteTableTarget,
  publicOrigin: string,
  dryRun: boolean,
  options: { mediaBucket?: string },
  result: MediaHostRewriteResult,
): Promise<void> {
  const rows = await fetchAllRows(
    client,
    target.table,
    selectColumnsFor(target),
    target.idColumn,
  )
  result.scannedRows += rows.length

  for (const row of rows) {
    const id = row[target.idColumn]
    if (typeof id !== 'string' || !id) continue

    const patch: Record<string, unknown> = {}
    let rowReplacements = 0

    for (const column of target.urlColumns ?? []) {
      const current = row[column]
      if (typeof current !== 'string' || !current) continue
      const rewritten = rewriteR2MediaUrl(current, publicOrigin, options)
      if (!rewritten) continue
      patch[column] = rewritten
      rowReplacements += 1
      pushSample(result.samples, {
        table: target.table,
        id,
        field: column,
        from: current,
        to: rewritten,
      })
      if (target.pathColumn) {
        const existingPath = row[target.pathColumn]
        const pathEmpty = typeof existingPath !== 'string' || !existingPath.trim()
        const key = pathFromRewrittenUrl(rewritten, publicOrigin)
        if (pathEmpty && key) patch[target.pathColumn] = key
      }
    }

    for (const column of target.textColumns ?? []) {
      const current = row[column]
      if (typeof current !== 'string' || !current) continue
      const rewritten = rewriteR2MediaString(current, publicOrigin, options)
      if (!rewritten) continue
      patch[column] = rewritten.next
      rowReplacements += rewritten.replacements
      pushSample(result.samples, {
        table: target.table,
        id,
        field: column,
        from: current,
        to: rewritten.next,
      })
    }

    if (rowReplacements === 0) continue

    result.rewrittenRows += 1
    result.replacements += rowReplacements
    result.byTable[target.table] = (result.byTable[target.table] ?? 0) + 1

    if (!dryRun) {
      const updated = await client.from(target.table).update(patch).eq(target.idColumn, id)
      if (updated.error) {
        throw new Error(`${target.table} ${id}: ${updated.error.message}`)
      }
    }
  }
}

async function rewriteSiteConfig(
  client: MediaRewriteClient,
  publicOrigin: string,
  dryRun: boolean,
  options: { mediaBucket?: string },
  result: MediaHostRewriteResult,
): Promise<void> {
  const rows = await fetchAllRows(client, 'site_config', 'key, value', 'key')
  result.scannedRows += rows.length

  for (const row of rows) {
    const key = row.key
    if (typeof key !== 'string' || !key) continue
    const rewritten = rewriteR2MediaJson(row.value, publicOrigin, options)
    if (rewritten.replacements === 0) continue

    result.rewrittenRows += 1
    result.replacements += rewritten.replacements
    result.byTable.site_config = (result.byTable.site_config ?? 0) + 1
    pushSample(result.samples, {
      table: 'site_config',
      id: key,
      field: 'value',
      from: JSON.stringify(row.value),
      to: JSON.stringify(rewritten.value),
    })

    if (!dryRun) {
      const updated = await client
        .from('site_config')
        .update({ value: rewritten.value })
        .eq('key', key)
      if (updated.error) {
        throw new Error(`site_config ${key}: ${updated.error.message}`)
      }
    }
  }
}

export async function applyMediaHostRewrite(
  client: MediaRewriteClient,
  options: {
    publicHost: string
    mediaBucket?: string
    dryRun: boolean
  },
): Promise<MediaHostRewriteResult> {
  const publicOrigin = normalizeR2PublicHost(options.publicHost)
  if (!publicOrigin) {
    throw new Error('R2_PUBLIC_HOST is missing or invalid')
  }

  const result = emptyResult(publicOrigin, options.dryRun)
  const rewriteOptions = { mediaBucket: options.mediaBucket }

  for (const target of MEDIA_HOST_REWRITE_TABLES) {
    await rewriteTable(client, target, publicOrigin, options.dryRun, rewriteOptions, result)
  }
  await rewriteSiteConfig(client, publicOrigin, options.dryRun, rewriteOptions, result)
  return result
}
