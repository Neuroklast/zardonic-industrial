/**
 * Next.js server boot hook. The existing R2-to-DB reconcile is not a schema
 * migration. Database DDL is managed exclusively in supabase/schema.sql.
 * No data import or migration is started automatically at boot.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.VERCEL_ENV !== 'production') return

  const { runProductionDeployR2Reconcile } = await import('@/lib/r2-reconcile-on-deploy')
  // Keep the established R2 reference-repair process, not the legacy data migration.
  void runProductionDeployR2Reconcile()
}
