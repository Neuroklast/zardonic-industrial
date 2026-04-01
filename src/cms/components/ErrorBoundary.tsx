/**
 * ErrorBoundary — catches React rendering errors in CMS components.
 */

import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class CmsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unknown error' }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-red-800 bg-[#1a0000] text-red-400 font-mono text-sm">
          <div className="text-red-500 font-bold mb-2">// RENDER ERROR</div>
          <div>{this.state.message}</div>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="mt-4 px-3 py-1 border border-red-600 text-red-400 hover:bg-red-900 text-xs"
          >
            RETRY
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
