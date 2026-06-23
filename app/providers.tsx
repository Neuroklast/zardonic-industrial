'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, domAnimation } from 'framer-motion'
import { ErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { LenisProvider } from '@/contexts/LenisContext'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { useState } from 'react'

function ErrorFallback({ error }: FallbackProps) {
  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', padding: '2rem' }}>
      <h1>Something went wrong</h1>
      <pre>{error instanceof Error ? error.message : String(error)}</pre>
    </div>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 5 * 60_000 },
        },
      }),
  )

  return (
    <LazyMotion features={domAnimation} strict={false}>
      <LenisProvider>
        <LocaleProvider>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              {children}
            </ErrorBoundary>
          </QueryClientProvider>
        </LocaleProvider>
      </LenisProvider>
    </LazyMotion>
  )
}
