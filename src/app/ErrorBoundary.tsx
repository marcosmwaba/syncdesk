import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '../core/ui';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Handled via fallback UI
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl px-4 py-12">
          <ErrorState
            title="Unexpected application error"
            message={this.state.message}
            onRetry={() => {
              this.setState({ hasError: false, message: '' });
            }}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
