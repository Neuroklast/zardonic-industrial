import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const schemaPath = join(root, 'supabase', 'schema.sql')
const schema = readFileSync(schemaPath, 'utf8')

describe('single canonical Supabase schema', () => {
  it('keeps exactly one SQL script and no migration directory', () => {
    const sqlFiles = readdirSync(join(root, 'supabase'), { recursive: true })
      .map(String)
      .filter((entry) => entry.endsWith('.sql'))
    expect(sqlFiles).toEqual(['schema.sql'])
    expect(existsSync(join(root, 'supabase', 'migrations'))).toBe(false)
  })

  it('includes the MCP OAuth and approval objects in the canonical schema', () => {
    for (const statement of [
      'CREATE TABLE IF NOT EXISTS public.mcp_oauth_clients',
      'CREATE TABLE IF NOT EXISTS public.mcp_oauth_mfa_grants',
      'CREATE TABLE IF NOT EXISTS public.mcp_content_requests',
      'CREATE OR REPLACE FUNCTION public.mcp_verify_oauth_mfa_grant',
      'CREATE OR REPLACE FUNCTION public.mcp_apply_content_request',
      'Deny direct OAuth client table access',
      'REVOKE ALL ON public.mcp_oauth_clients FROM PUBLIC, anon, authenticated',
      'REVOKE ALL ON public.mcp_content_requests FROM PUBLIC, anon, authenticated',
      'GRANT EXECUTE ON FUNCTION public.mcp_apply_content_request(uuid,uuid) TO service_role',
    ]) {
      expect(schema).toContain(statement)
    }
  })

  it('does not expose migration CLI commands or run data migrations at boot', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
    }
    expect(pkg.scripts).not.toHaveProperty('migrate')
    expect(pkg.scripts).not.toHaveProperty('migrate-legacy')

    const boot = readFileSync(join(root, 'instrumentation.ts'), 'utf8')
    expect(boot).not.toContain('runProductionDeployLegacyUrlMigration')
    expect(boot).toContain('runProductionDeployR2Reconcile')
  })
})
