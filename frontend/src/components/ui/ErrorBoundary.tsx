import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  failed: boolean;
}

/** Catches render errors so one broken component shows a message instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode; label?: string }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Render error caught by ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto my-16 max-w-xl rounded-card border border-line bg-surface p-6 text-center">
        <p className="text-lg font-semibold">Something went wrong{this.props.label ? ` in ${this.props.label}` : ''}.</p>
        <p className="mt-2 text-muted">Reload the page to try again.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 min-h-11 rounded-control bg-btn px-5 font-medium text-btn-fg hover:bg-btn-hover"
        >
          Reload
        </button>
      </div>
    );
  }
}
