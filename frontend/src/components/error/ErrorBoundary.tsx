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

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // Production'da error monitoring servisine gönder
    if (import.meta.env.PROD) {
      // Sentry.captureException(error, { extra: errorInfo });
      // veya custom endpoint'e POST
      try {
        fetch('/api/error-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => { /* sessizce başarısız ol */ });
      } catch {
        // Hata raporlama başarısız olsa bile uygulamayı etkilemesin
      }
    }
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
