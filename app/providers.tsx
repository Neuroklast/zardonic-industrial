'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, domAnimation } from 'framer-motion'
import { ErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { LenisProvider } from '@/contexts/LenisContext'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { AnalyticsTracker } from '@/components/AnalyticsTracker'
import type { AnalyticsConfig } from '@/lib/analytics-config'
import type { SiteLanguage } from '@/lib/i18n'
import type { CustomTranslations } from '@/lib/translations-config'
import { useState } from 'react'

function ErrorFallback({ error }: FallbackProps) {
  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', padding: '2rem' }}>
      <h1>Something went wrong</h1>
      <pre>{error instanceof Error ? error.message : String(error)}</pre>
    </div>
  )
}

interface ProvidersProps {
  children: React.ReactNode
  customTranslations?: CustomTranslations
  analyticsConfig?: AnalyticsConfig
  languages?: SiteLanguage[]
}

export function Providers({
  children,
  customTranslations,
  analyticsConfig,
  languages,
}: ProvidersProps) {
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
        <LocaleProvider customTranslations={customTranslations} languages={languages}>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              {children}
            </ErrorBoundary>
          </QueryClientProvider>
          {analyticsConfig ? <AnalyticsTracker config={analyticsConfig} /> : null}
        </LocaleProvider>
      </LenisProvider>
    </LazyMotion>
  )
}
