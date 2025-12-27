import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-void flex items-center justify-center">
          <div className="text-center max-w-md px-8">
            <div className="text-6xl mb-4">!</div>
            <h1 className="text-xl font-bold mt-4 text-white">Something went wrong</h1>
            <p className="text-text-muted mt-2 text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="mt-6 space-x-3">
              <button
                className="btn-primary px-4 py-2 rounded-lg"
                onClick={() => window.location.reload()}
              >
                Restart App
              </button>
              <button
                className="btn-secondary px-4 py-2 rounded-lg"
                onClick={() => this.setState({ hasError: false })}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
