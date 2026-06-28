import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error);
    this.setState({ hasError: true, error: error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg0)] flex items-center justify-center p-4">
          <div className="bg-[var(--bg1)] border border-[var(--border)] rounded-xl p-8 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-[var(--red)]/10 rounded-full flex items-center justify-center mx-auto">
              <i className="ti ti-alert-triangle text-[var(--red)] text-3xl"></i>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[var(--t1)] mb-2">Application Error</h1>
              <p className="text-[var(--t2)]">{this.state.error}</p>
            </div>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-12 px-6 bg-[var(--blue)] text-[var(--t1)] rounded-lg hover:bg-[var(--blue)]/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;