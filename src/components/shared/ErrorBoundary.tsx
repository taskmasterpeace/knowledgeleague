import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Game error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg flex flex-col items-center justify-center gap-6 p-8">
          <div className="text-6xl">💥</div>
          <h1 className="font-pixel text-xl text-red-400 text-center">SOMETHING WENT WRONG</h1>
          <p className="font-pixel-body font-semibold text-sm text-white/50 text-center max-w-md">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.hash = ''
              window.location.reload()
            }}
            className="pixel-btn font-pixel py-4 px-8 bg-indigo-700 hover:bg-indigo-600 text-white text-xs rounded-lg transition-colors"
          >
            BACK TO MENU
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
