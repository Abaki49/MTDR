import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.reset)
      }
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <button type="button" className="btn btn-primary" onClick={this.reset}>Try Again</button>
        </div>
      )
    }
    return this.props.children
  }
}
