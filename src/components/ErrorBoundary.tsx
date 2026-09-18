import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = (): void => {
    localStorage.removeItem('imasbtc_view_mode');
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleHardReset = (): void => {
    localStorage.clear();
    window.location.reload();
  };

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0b101f] border border-rose-500/30 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div>
              <h2 className="text-xl font-black font-display text-white">AKIRA.QU Terminal Recovery</h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Terjadi kendala sementara saat merender antarmuka. Silakan muat ulang atau pulihkan sesi default.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-black/40 border border-slate-800 rounded-lg text-left text-[11px] font-mono text-rose-300 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Terminal</span>
              </button>

              <button
                onClick={this.handleHardReset}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Cache & Sesi Bersih</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
