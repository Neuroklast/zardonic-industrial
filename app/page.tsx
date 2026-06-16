'use client'

import { Suspense } from 'react'
import AppShell from '@/components/AppShell'
import { useAppState } from '@/hooks/use-app-state'
import { LocaleProvider } from '@/contexts/LocaleContext'

function AppPage() {
  const appState = useAppState()
  return (
    <LocaleProvider customTranslations={appState.adminSettings?.customTranslations}>
      <AppShell {...appState} />
    </LocaleProvider>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ background: '#0a0a0a', minHeight: '100vh' }} />}>
      <AppPage />
    </Suspense>
  )
}
