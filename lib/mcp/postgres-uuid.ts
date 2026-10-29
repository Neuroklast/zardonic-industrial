import { z } from 'zod'

/** PostgreSQL UUID inputs accept any 8-4-4-4-12 hexadecimal UUID.
 * Existing imported catalogues include values whose version/variant bits do
 * not satisfy RFC 4122. Do not reject valid PostgreSQL UUID column values.
 * This validates syntax only; authorization remains independent.
 */
export const postgresUuid = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
)
