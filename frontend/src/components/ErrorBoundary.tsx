import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center px-6">
        <div className="max-w-md text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
            Terjadi Kesalahan
          </h1>
          <p className="text-sm text-slate-500 mb-4">
            Aplikasi mengalami error yang tidak terduga. Silakan coba muat ulang halaman.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <div className="text-left bg-slate-900 text-slate-300 rounded-xl p-4 mb-6 text-[11px] font-mono overflow-x-auto max-h-40 overflow-y-auto">
              <p className="text-red-400 font-semibold mb-1">{this.state.error.name}: {this.state.error.message}</p>
              <pre className="text-slate-500 whitespace-pre-wrap">{this.state.error.stack}</pre>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-sm px-5 py-2.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang</span>
            </button>
            <a href="/" className="btn-secondary text-sm px-5 py-2.5">
              <Home className="w-4 h-4" />
              <span>Beranda</span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}
