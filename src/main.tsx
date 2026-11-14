import { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Unexpected runtime error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('NEON GALAXY runtime error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#030308] px-6 text-center text-white">
          <h1 className="font-display text-2xl font-black text-cyan-300">NEON GALAXY // Recovery</h1>
          <p className="mt-2 max-w-md text-sm text-slate-300">{this.state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 cursor-pointer"
          >
            Reload Game
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function mountApp() {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  createRoot(rootEl).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp, { once: true });
} else {
  mountApp();
}
