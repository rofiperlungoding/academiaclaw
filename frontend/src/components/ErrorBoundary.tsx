import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full animate-fade-in">
          <p className="eyebrow">Error</p>
          <h1 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-zinc-900">
            Something went wrong
          </h1>
          <p className="mt-2 muted">The app stopped unexpectedly. Reload the page.</p>

          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-5 max-h-40 overflow-auto rounded-lg bg-zinc-900 p-3.5 text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap">
              <span className="text-red-400">
                {this.state.error.name}: {this.state.error.message}
              </span>
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}

          <div className="mt-7 flex gap-2">
            <button onClick={() => window.location.reload()} className="btn-primary">
              Reload
            </button>
            <a href="/" className="btn-secondary">Home</a>
          </div>
        </div>
      </div>
    );
  }
}
