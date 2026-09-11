import React from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 shadow-xl text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Se produjo una inconsistencia de vista</h2>
            <p className="text-sm text-slate-500 mb-6">
              El sistema ha prevenido una pantalla en blanco. Puedes recargar para continuar trabajando normalmente.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-100 p-3 rounded-lg text-left text-xs font-mono text-slate-600 mb-6 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCcw className="w-4 h-4" />
              Recargar la Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
