import { useAppState } from '@/hooks/use-app-state'
import { LocaleProvider } from '@/contexts/LocaleContext'
import AppShell from '@/components/AppShell'

export type { SiteData } from '@/lib/app-types'

function App() {
  const appState = useAppState()
  return (
    <LocaleProvider customTranslations={appState.adminSettings?.customTranslations}>
      <AppShell {...appState} />
    </LocaleProvider>
  )
}

export default App
