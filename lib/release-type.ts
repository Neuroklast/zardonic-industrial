/**
 * Canonical release-type classification, shared by the public UI and every
 * catalogue sync source (iTunes / Spotify / Discogs).
 *
 * Why one classifier: Apple's iTunes Search API reports `collectionType:
 * "Album"` for *every* collection — singles and EPs included — so it cannot be
 * trusted on its own. Spotify reports EPs as `album_type: "single"`. Discogs
 * only exposes type through free-text format descriptions. The only signals
 * that survive all three sources are:
 *
 *   1. semantic title markers (remix / compilation) — authoritative,
 *   2. an explicitly declared platform type (when the platform is trustworthy),
 *   3. the trailing Apple suffix (`- Single`, `- EP`) / parenthetical marker,
 *   4. the number of tracks on the release.
 *
 * Track-count thresholds follow the common convention: 1–2 tracks → single,
 * 3–6 → EP, 7+ → album.
 */

export type ReleaseTypeValue = 'album' | 'ep' | 'single' | 'remix' | 'compilation'

export interface ReleaseTypeSignals {
  /** Release title (may contain platform suffixes such as `- Single`). */
  title: string
  /**
   * Platform-declared type, when it can be trusted. Pass `null`/omit for
   * iTunes `collectionType` — it is unreliable. May be a single token or a
   * space-joined list (e.g. Discogs format descriptions).
   */
  declaredType?: string | null
  /** Number of tracks on the release, when known. */
  trackCount?: number | null
  /** Extra context: Discogs genres/styles, platform groups, etc. */
  hints?: string[]
  /**
   * Per-track artist credits (comma / `&` / `feat.` separated names allowed),
   * one entry per track. Enables the "Appears On vs Album" rule: a long release
   * is an album when some artist is credited on **every** track (Zardonic +
   * guests) and "Appears On" when no artist spans all tracks.
   */
  trackArtists?: Array<string | null | undefined> | null
  /** Release-level primary artist, used when a track lists no artist. */
  primaryArtist?: string | null
}

/** Minimum track count before the Appears On / Album artist rule applies. */
export const APPEARS_ON_MIN_TRACKS = 6
/** Minimum distinct artists for a long release to count as "many different artists". */
export const APPEARS_ON_MIN_ARTISTS = 3

export interface ReleaseTypeThresholds {
  /** Tracks ≤ this count are a single. */
  singleMax: number
  /** Tracks ≤ this count (and > singleMax) are an EP. */
  epMax: number
}

export const DEFAULT_RELEASE_TYPE_THRESHOLDS: ReleaseTypeThresholds = {
  singleMax: 2,
  epMax: 6,
}

const REMIX_RE = /\bremix(?:es|ed)?\b|\brmx\b/i
const COMPILATION_RES: RegExp[] = [
  /\bcompilation\b/i,
  /\bbest of\b/i,
  /\bgreatest hits\b/i,
]
const EP_TOKEN_RE = /\bep\b|\bextended play\b/i
const SINGLE_TOKEN_RE = /\bsingles?\b/i

/**
 * Trailing platform suffix, e.g. `Foo - Single`, `Foo – EP`, `Foo (Remixes)`.
 * Apple appends `- Single` / `- EP` reliably; the classifier treats it as an
 * explicit signal.
 */
const TRAILING_SUFFIX_RE =
  /[-–—:]\s*(single|singles|ep|extended play|remix(?:es)?|rmx|compilation|album)\s*$/i

const PARENTHETICAL_TYPE_RE = /\(\s*(single|singles|ep|extended play|remix(?:es)?|rmx|compilation)\s*\)/i

const DECLARED_REMIX_RE = /\bremix(?:es|ed)?\b|\brmx\b/i
const DECLARED_COMPILATION_RE = /\bcompilation\b/i
const DECLARED_EP_RE = /\bep\b|\bextended play\b/i
const DECLARED_SINGLE_RE = /\bmaxi[- ]?single\b|\bsingle\b/i
const DECLARED_ALBUM_RE = /\balbum\b/i

/**
 * Maps an internal release type value to its user-facing display label.
 * 'single' and 'ep' are grouped under the single combined label 'Single / EP'.
 * 'compilation' is shown as **Appears On** (a release the artist only features
 * on, rather than a release of their own). Returns the raw value for any
 * unknown input so callers can apply a fallback.
 */
export function displayReleaseType(type: string): string {
  switch (type) {
    case 'album':
      return 'Album'
    case 'ep':
    case 'single':
      return 'Single / EP'
    case 'remix':
      return 'Remix'
    case 'compilation':
      return 'Appears On'
    default:
      return type
  }
}

function suffixToType(value: string): ReleaseTypeValue | null {
  const lower = value.toLowerCase()
  if (lower === 'single' || lower === 'singles') return 'single'
  if (lower === 'ep' || lower === 'extended play') return 'ep'
  if (lower === 'remix' || lower === 'remixes' || lower === 'rmx') return 'remix'
  if (lower === 'compilation') return 'compilation'
  if (lower === 'album') return 'album'
  return null
}

function normalizeDeclaredType(value: string | null | undefined): ReleaseTypeValue | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null

  if (DECLARED_REMIX_RE.test(normalized)) return 'remix'
  if (DECLARED_COMPILATION_RE.test(normalized)) return 'compilation'
  if (DECLARED_EP_RE.test(normalized)) return 'ep'
  if (DECLARED_SINGLE_RE.test(normalized)) return 'single'
  if (DECLARED_ALBUM_RE.test(normalized)) return 'album'
  return null
}

const ARTIST_SPLIT_RE = /\s*(?:,|&|\+|\/|\bfeat\.?\b|\bfeaturing\b|\bft\.?\b|\bwith\b|\bx\b)\s*/i

function splitArtistNames(value: string): string[] {
  return value
    .split(ARTIST_SPLIT_RE)
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)
}

function trackArtistNames(
  trackArtist: string | null | undefined,
  primaryArtist: string | null | undefined,
): Set<string> {
  const names = splitArtistNames(trackArtist ?? '')
  if (names.length > 0) return new Set(names)
  return new Set(splitArtistNames(primaryArtist ?? ''))
}

/**
 * Whether a single artist is credited on **every** track.
 *
 * - `true`  → some artist spans all tracks (a Zardonic album, even with guests),
 * - `false` → the tracks share no artist (a various-artists compilation),
 * - `null`  → not enough per-track artist data to decide.
 */
export function hasArtistOnEveryTrack(
  trackArtists: Array<string | null | undefined> | null | undefined,
  primaryArtist?: string | null,
): boolean | null {
  if (!trackArtists || trackArtists.length === 0) return null

  let intersection: Set<string> | null = null
  for (const raw of trackArtists) {
    const names = trackArtistNames(raw, primaryArtist)
    if (names.size === 0) return null
    if (intersection === null) {
      intersection = names
      continue
    }
    const shared = new Set<string>()
    for (const name of intersection) {
      if (names.has(name)) shared.add(name)
    }
    if (shared.size === 0) return false
    intersection = shared
  }
  return true
}

function distinctTrackArtistCount(
  trackArtists: Array<string | null | undefined> | null | undefined,
  primaryArtist?: string | null,
): number {
  const all = new Set<string>()
  for (const raw of trackArtists ?? []) {
    for (const name of trackArtistNames(raw, primaryArtist)) all.add(name)
  }
  return all.size
}

/**
 * Classifies a release into one of the five stored catalogue types.
 *
 * Priority (most reliable first):
 *   1. remix title/hint marker — always wins,
 *   2. Appears On vs Album from per-track artist credits (≥6 tracks): an album
 *      when some artist is credited on every track, "Appears On" (compilation)
 *      when no artist spans the tracks and there are many distinct artists,
 *   3. semantic compilation markers (best of / greatest hits / compilation),
 *   4. trustworthy platform-declared type,
 *   5. explicit title suffix / parenthetical marker (`- Single`, `(EP)`),
 *   6. bare `EP` token in the title,
 *   7. track-count thresholds,
 *   8. bare `Single` token in the title,
 *   9. fallback: `album`.
 */
export function classifyReleaseType(
  signals: ReleaseTypeSignals,
  thresholds: ReleaseTypeThresholds = DEFAULT_RELEASE_TYPE_THRESHOLDS,
): ReleaseTypeValue {
  const title = signals.title ?? ''
  const hints = signals.hints ?? []
  const haystack = [title, ...hints].join(' ')

  // 1. Remix is authoritative — a title with "Remix"/"RMX" is a remix, regardless
  //    of track count or a platform's generic "Album" label.
  if (REMIX_RE.test(haystack)) return 'remix'

  // 2. Appears On vs Album from per-track artist credits. Only meaningful for
  //    long releases; shorter ones fall through to the single/EP logic below.
  const count = signals.trackCount
  if (typeof count === 'number' && Number.isFinite(count) && count >= APPEARS_ON_MIN_TRACKS) {
    const sharedArtist = hasArtistOnEveryTrack(signals.trackArtists, signals.primaryArtist)
    if (sharedArtist === true) return 'album'
    if (
      sharedArtist === false &&
      distinctTrackArtistCount(signals.trackArtists, signals.primaryArtist) >= APPEARS_ON_MIN_ARTISTS
    ) {
      return 'compilation'
    }
  }

  // 3. Semantic compilation markers.
  if (COMPILATION_RES.some((re) => re.test(haystack))) return 'compilation'

  // 4. Trustworthy declared type (Spotify album_type, Discogs formats, …).
  const declared = normalizeDeclaredType(signals.declaredType)
  if (declared) return declared

  // 5. Explicit Apple-style suffix or parenthetical marker.
  const suffixMatch = title.match(TRAILING_SUFFIX_RE) ?? title.match(PARENTHETICAL_TYPE_RE)
  const suffixType = suffixMatch ? suffixToType(suffixMatch[1]) : null
  if (suffixType) return suffixType

  // 6. Bare "EP" token in the title is explicit enough to beat track count.
  if (EP_TOKEN_RE.test(title)) return 'ep'

  // 7. Track count.
  if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
    if (count <= thresholds.singleMax) return 'single'
    if (count <= thresholds.epMax) return 'ep'
    return 'album'
  }

  // 8. Weak title marker: "Single". Only used when no track count exists, so a
  //    full-length titled "Singles" is not misclassified.
  if (SINGLE_TOKEN_RE.test(title)) return 'single'

  // 9. Fallback.
  return 'album'
}

/** The four buckets shown by the admin quick-select control. */
export type QuickSelectReleaseType = 'single' | 'remix' | 'album' | 'compilation'

/**
 * Maps a stored release type to one of the four admin quick-select buckets.
 * `ep` folds into `single` (the public label groups them as "Single / EP").
 * Returns null for empty/unknown values so no button is highlighted.
 */
export function toQuickSelectReleaseType(
  type: string | null | undefined,
): QuickSelectReleaseType | null {
  switch ((type ?? '').trim().toLowerCase()) {
    case 'single':
    case 'ep':
      return 'single'
    case 'remix':
      return 'remix'
    case 'album':
      return 'album'
    case 'compilation':
      return 'compilation'
    default:
      return null
  }
}

/**
 * Whether there is at least one *explicit* signal to justify a type. Used by
 * the one-off reclassification pass so a bare title never rewrites a curated
 * value to the 'album' fallback. The weak bare "Single" token is excluded.
 */
export function hasExplicitReleaseTypeSignal(
  signals: Pick<ReleaseTypeSignals, 'title' | 'trackCount' | 'hints' | 'trackArtists'>,
): boolean {
  const title = signals.title ?? ''
  const haystack = [title, ...(signals.hints ?? [])].join(' ')

  if (REMIX_RE.test(haystack)) return true
  if (COMPILATION_RES.some((re) => re.test(haystack))) return true
  if (TRAILING_SUFFIX_RE.test(title) || PARENTHETICAL_TYPE_RE.test(title)) return true
  if (EP_TOKEN_RE.test(title)) return true
  if (typeof signals.trackCount === 'number' && signals.trackCount > 0) return true
  if (signals.trackArtists && signals.trackArtists.length > 0) return true

  return false
}

/**
 * Whether a platform-declared value is specific enough to trust. Apple's
 * `collectionType` is always `"Album"`, so callers should pass it through this
 * guard before handing it to `classifyReleaseType`.
 */
export function trustworthyDeclaredType(
  value: string | null | undefined,
  unreliableValues: string[] = ['album'],
): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (unreliableValues.includes(normalized)) return null
  return value.trim()
}
