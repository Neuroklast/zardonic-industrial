/**
 * After a successful media replace, drop the previous R2 object so storage
 * does not accumulate orphans. Never fails the new upload: delete errors are
 * returned for optional UI status only.
 */
export function shouldDeletePreviousR2Object(
  previousPath: string | null | undefined,
  newPath: string,
): previousPath is string {
  const prev = previousPath?.trim()
  const next = newPath.trim()
  return Boolean(prev && next && prev !== next)
}

export async function deletePreviousR2ObjectIfReplaced(
  previousPath: string | null | undefined,
  newPath: string,
): Promise<{ deleted: boolean; error?: string }> {
  if (!shouldDeletePreviousR2Object(previousPath, newPath)) {
    return { deleted: false }
  }

  const { deleteR2MediaObject } = await import('@/app/admin/_actions/r2Upload')
  const result = await deleteR2MediaObject(previousPath)
  if (!result.ok) {
    return { deleted: false, error: result.error }
  }
  return { deleted: true }
}
