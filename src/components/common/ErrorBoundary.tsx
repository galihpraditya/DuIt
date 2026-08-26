import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Language } from '../../constants/translations';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  lang?: Language;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('View crashed:', error);
  }

  render() {
    if (this.state.hasError) {
      const isId = (this.props.lang ?? 'id') === 'id';
      return (
        <div className="glass-card rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isId ? 'Terjadi kesalahan saat menampilkan data' : 'Something went wrong while rendering this view'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isId
              ? 'Coba muat ulang halaman. Jika masalah berlanjut, periksa kembali data transaksi Anda.'
              : 'Try reloading the page. If the problem persists, please check your transaction data.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
          >
            {isId ? 'Coba Lagi' : 'Try Again'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
