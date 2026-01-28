import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    event.preventDefault();
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    console.error('Unhandled promise rejection:', error);
    this.props.onError?.(error, { componentStack: '' } as ErrorInfo);
    this.setState({ hasError: true, error });
  };

  componentDidMount(): void {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount(): void {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        // Clone fallback element and pass reset function
        if (React.isValidElement(this.props.fallback)) {
          return React.cloneElement(this.props.fallback as React.ReactElement<{ onReset?: () => void; error?: Error }>, {
            onReset: this.handleReset,
            error: this.state.error ?? undefined,
          });
        }
        return this.props.fallback;
      }

      // Default fallback
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Bir hata oluştu</h2>
          <button onClick={this.handleReset}>Tekrar Dene</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
