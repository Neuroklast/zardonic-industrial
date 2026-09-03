/**
 * Next.js server boot hook. On Vercel Production this runs the R2↔DB
 * filename reconcile once per git SHA (see lib/r2-reconcile-on-deploy.ts) and
 * the legacy `*.supabase.co` storage URL migration (lib/legacy-url-migration-on-deploy.ts).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.VERCEL_ENV !== 'production') return

  const { runProductionDeployR2Reconcile } = await import('@/lib/r2-reconcile-on-deploy')
  // Do not await: a long R2 list would time out the first serverless isolate.
  void runProductionDeployR2Reconcile()

  const { runProductionDeployLegacyUrlMigration } = await import('@/lib/legacy-url-migration-on-deploy')
  // Same best-effort pattern: downloads can be slow; never block the booting isolate.
  void runProductionDeployLegacyUrlMigration()
}
