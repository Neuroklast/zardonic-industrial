import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { LocaleProvider } from './contexts/LocaleContext.tsx'
import { CmsRouter } from './cms/CmsRouter.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LocaleProvider>
          <Routes>
            <Route path="/cms/*" element={<CmsRouter />} />
            <Route path="*" element={<App />} />
          </Routes>
        </LocaleProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
)
