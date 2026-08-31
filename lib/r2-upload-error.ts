/**
 * Human-readable message for a failed browser→R2 presigned-URL upload.
 *
 * The browser never surfaces R2's real status when a cross-origin PUT is
 * blocked: a missing CORS policy (or a matching origin not yet applied /
 * purged) throws a bare `TypeError: Failed to fetch`. The upload code should
 * route errors through `describeR2UploadError` so the admin sees a fix hint
 * instead of only "Upload failed".
 */
export function describeR2UploadError(
  err: unknown,
  context: string,
): string {
  const raw = err instanceof Error ? err.message : String(err ?? '')
  const network = /failed to fetch|networkerror|network error|load failed|fetch failed|ERR_FAILED/i.test(raw)

  if (network) {
    return (
      `${context} was blocked in the browser. This is usually the R2 bucket CORS policy ` +
      `not allowing this site to PUT. Add this origin (or "*") to the bucket CORS ` +
      `(Dashboard → R2 → bucket → Settings → CORS Policy), then purge the R2 cache. ` +
      `See docs/ADMIN_GUIDE.md → "R2 bucket CORS (browser uploads)".`
    )
  }

  if (!raw) return `${context} failed`
  return `${context} failed: ${raw}`
}
