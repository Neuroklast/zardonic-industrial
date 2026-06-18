import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  res.status(404).json({
    error: 'Legacy admin session API has been removed.',
    message: 'Use Supabase authentication via /admin/login.',
  })
}
