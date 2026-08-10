'use client'

/**
 * SectionErrorBoundary – A lightweight ErrorBoundary for individual page sections.
 *
 * When a section crashes it shows a minimal fallback with a retry button instead
 * of taking down the entire page.
 */
import { Component, type ReactNode, type ErrorInfo } from 'react'
import { useLocale } from '@/contexts/LocaleContext'

interface Props {
  /** Short label shown in the fallback (e.g. "Bio", "Events"). */
  sectionName: string
  children: ReactNode
  /**
   * When this changes after an error, the boundary resets automatically
   * (e.g. pass locale so a language switch retries the section).
   */
  resetKey?: string | number
}

interface State {
  hasError: boolean
  errorMessage: string
}

function SectionErrorFallback({
  sectionName,
  errorMessage,
  onRetry,
}: {
  sectionName: string
  errorMessage: string
  onRetry: () => void
}) {
  const { t } = useLocale()
  // Only expose error details in development to avoid leaking stack paths
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development'

  return (
    <div
      className="py-12 px-6 flex flex-col items-center gap-4 text-center"
      aria-live="polite"
      role="alert"
    >
      <div className="font-mono text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded px-4 py-2">
        [{sectionName}] – {t('section.errorRender')}
      </div>
      {isDev && errorMessage ? (
        <p className="font-mono text-xs text-muted-foreground max-w-sm break-words">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        className="font-mono text-xs px-4 py-2 border border-border rounded hover:border-primary hover:text-primary transition-colors min-h-[44px]"
      >
        ↺ {t('section.errorRetry')}
      </button>
    </div>
  )
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SectionErrorBoundary] Section "${this.props.sectionName}" crashed:`, error, info)
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey &&
      this.props.resetKey !== undefined
    ) {
      this.setState({ hasError: false, errorMessage: '' })
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <SectionErrorFallback
          sectionName={this.props.sectionName}
          errorMessage={this.state.errorMessage}
          onRetry={this.handleRetry}
        />
      )
    }
    return this.props.children
  }
}
