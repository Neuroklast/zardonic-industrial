/**
 * Prisma Client singleton.
 * OWASP A04:2021 — Insecure Design: Use parameterised queries via ORM only.
 * Re-uses a single client instance across serverless function invocations.
 */

import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development (Next.js HMR pattern)
declare global {
  var __prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
